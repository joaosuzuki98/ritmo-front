import { pbkdf2Async } from '@noble/hashes/pbkdf2.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex } from '@noble/hashes/utils.js'
import { randomId } from '@nozbe/watermelondb/utils/common'

import { database, type User } from './index'

const passwordHashIterations = 120_000

export type LocalRegistrationData = {
    name: string
    email: string
    password: string
}

const normalizeEmail = (email: string) => email.trim().toLowerCase()

export const deriveLocalPasswordHash = async (
    password: string,
    salt: string,
): Promise<string> =>
    bytesToHex(
        await pbkdf2Async(sha256, password, salt, {
            c: passwordHashIterations,
            dkLen: 32,
        }),
    )

export const registerLocalUser = async ({
    name,
    email,
    password,
}: LocalRegistrationData): Promise<User> => {
    const users = await database.get<User>('users').query().fetch()
    const normalizedEmail = normalizeEmail(email)
    if (users.some(user => normalizeEmail(user.email) === normalizedEmail)) {
        throw new Error('Já existe uma conta com este e-mail.')
    }
    const passwordSalt = randomId()
    const passwordHash = await deriveLocalPasswordHash(password, passwordSalt)

    let createdUser: User | undefined
    await database.write(async () => {
        for (const user of users) {
            if (user.isLoggedIn) {
                await user.update(record => {
                    record.isLoggedIn = false
                    record.updatedAt = new Date()
                })
            }
        }

        const now = new Date()
        createdUser = await database.get<User>('users').create(record => {
            record.name = name.trim()
            record.email = normalizedEmail
            record.passwordHash = passwordHash
            record.passwordSalt = passwordSalt
            record.totalPoints = 0
            record.level = 1
            record.isLoggedIn = true
            record.createdAt = now
            record.updatedAt = now
        })
    })

    if (!createdUser) throw new Error('Não foi possível criar sua conta.')
    return createdUser
}

export const authenticateLocalUser = async (
    email: string,
    password: string,
): Promise<User> => {
    const users = await database.get<User>('users').query().fetch()
    const normalizedEmail = normalizeEmail(email)
    const user = users.find(
        record => normalizeEmail(record.email) === normalizedEmail,
    )
    if (!user) {
        throw new Error('E-mail ou senha incorretos.')
    }

    const isLegacyLogin =
        !user.passwordHash &&
        !user.passwordSalt &&
        user.legacyPassword === password
    if (!isLegacyLogin) {
        if (
            !user.passwordHash ||
            !user.passwordSalt ||
            (await deriveLocalPasswordHash(password, user.passwordSalt)) !==
                user.passwordHash
        ) {
            throw new Error('E-mail ou senha incorretos.')
        }
    }

    let legacyPasswordSalt: string | undefined
    let legacyPasswordHash: string | undefined
    if (isLegacyLogin) {
        legacyPasswordSalt = randomId()
        legacyPasswordHash = await deriveLocalPasswordHash(
            password,
            legacyPasswordSalt,
        )
    }

    await database.write(async () => {
        for (const record of users) {
            const shouldBeLoggedIn = record.id === user.id
            const shouldUpgradeLegacyPassword =
                isLegacyLogin && record.id === user.id
            if (
                record.isLoggedIn !== shouldBeLoggedIn ||
                shouldUpgradeLegacyPassword
            ) {
                await record.update(current => {
                    current.isLoggedIn = shouldBeLoggedIn
                    current.updatedAt = new Date()
                    if (shouldUpgradeLegacyPassword) {
                        current.passwordHash = legacyPasswordHash
                        current.passwordSalt = legacyPasswordSalt
                        current.legacyPassword = undefined
                    }
                })
            }
        }
    })

    return user
}

export const restoreLocalSession = async (): Promise<User | null> => {
    const users = await database.get<User>('users').query().fetch()
    return users.find(user => user.isLoggedIn) ?? null
}

export const logoutLocalUser = async (userId: string): Promise<void> => {
    const user = await database.get<User>('users').find(userId)
    await database.write(async () => {
        await user.update(record => {
            record.isLoggedIn = false
            record.updatedAt = new Date()
        })
    })
}
