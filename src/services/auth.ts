import { Q } from '@nozbe/watermelondb'
import axios from 'axios'

import { database, type User } from '../database'
import type { OnboardingIdentity } from '../types/onboarding'
import { authEndpoints, type AuthUserResponse } from './endpoints/auth'
import {
    clearAuthSession,
    getStoredSessionUserId,
    revokeAndClearAuthSession,
    storeAuthSession,
} from './authSession'

const normalizeApiError = (error: unknown) => {
    if (axios.isAxiosError(error)) {
        const responseMessage = (
            error.response?.data as { error?: { message?: string } } | undefined
        )?.error?.message
        if (responseMessage) return new Error(responseMessage)
        if (!error.response) {
            return new Error('Conecte-se à internet e tente novamente.')
        }
    }
    if (error instanceof Error) return error
    return new Error('Não foi possível autenticar. Tente novamente.')
}

const persistAuthenticatedUser = async (
    remoteUser: AuthUserResponse,
): Promise<User> => {
    const collection = database.get<User>('users')
    const existingUsers = await collection
        .query(Q.where('id', remoteUser.id))
        .fetch()
    const existingUser = existingUsers[0]
    let savedUser: User | undefined

    await database.write(async () => {
        if (existingUser) {
            savedUser = await existingUser.update(record => {
                record.isLoggedIn = true
            })
            return
        }

        savedUser = collection.prepareCreateFromDirtyRaw({
            id: remoteUser.id,
            _status: 'synced',
            _changed: '',
            name: remoteUser.name,
            mascot_name: remoteUser.mascotName,
            email: remoteUser.email,
            total_points: remoteUser.totalPoints,
            level: remoteUser.level,
            is_logged_in: true,
            created_at: remoteUser.createdAt,
            updated_at: remoteUser.updatedAt,
        })
        await database.batch(savedUser)
    })

    if (!savedUser) throw new Error('Não foi possível salvar o perfil local.')
    return savedUser
}

const saveAuthenticatedResponse = async (
    response: Awaited<ReturnType<typeof authEndpoints.login>>,
) => {
    const user = await persistAuthenticatedUser(response.user)
    await storeAuthSession(response)
    return user
}

export const registerUser = async (
    input: OnboardingIdentity & { email: string; password: string },
) => {
    try {
        const response = await authEndpoints.register(input)
        return await saveAuthenticatedResponse(response)
    } catch (error) {
        throw normalizeApiError(error)
    }
}

export const authenticateUser = async (email: string, password: string) => {
    try {
        const response = await authEndpoints.login({ email, password })
        return await saveAuthenticatedResponse(response)
    } catch (error) {
        throw normalizeApiError(error)
    }
}

export const restoreLocalSession = async (): Promise<User | null> => {
    const userId = await getStoredSessionUserId()
    if (!userId) return null

    const users = await database
        .get<User>('users')
        .query(Q.where('id', userId))
        .fetch()
    const user = users[0]
    if (!user) {
        await clearAuthSession()
        return null
    }
    if (!user.isLoggedIn) {
        await database.write(async () => {
            await user.update(record => {
                record.isLoggedIn = true
            })
        })
    }
    return user
}

export const logoutUser = async (userId: string) => {
    await revokeAndClearAuthSession()
    const users = await database
        .get<User>('users')
        .query(Q.where('id', userId))
        .fetch()
    const user = users[0]
    if (!user || !user.isLoggedIn) return
    await database.write(async () => {
        await user.update(record => {
            record.isLoggedIn = false
            record.updatedAt = new Date()
        })
    })
}

export const requestPasswordReset = async (email: string) => {
    try {
        return await authEndpoints.requestPasswordReset(email)
    } catch (error) {
        throw normalizeApiError(error)
    }
}

export const completePasswordReset = async (input: {
    email: string
    code: string
    password: string
}) => {
    try {
        return await authEndpoints.completePasswordReset(input)
    } catch (error) {
        throw normalizeApiError(error)
    }
}
