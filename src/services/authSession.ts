import * as Keychain from 'react-native-keychain'

import { authEndpoints, type AuthResponse } from './endpoints/auth'

const refreshTokenService = 'com.ritmo.auth.refresh-token'
const accessTokenSafetyWindowMs = 30_000

type AccessToken = { token: string; expiresAt: number }

let accessToken: AccessToken | null = null
let refreshInFlight: Promise<string | null> | null = null

export const storeAuthSession = async (session: AuthResponse) => {
    const result = await Keychain.setGenericPassword(
        session.user.id,
        session.refreshToken,
        {
            service: refreshTokenService,
            accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        },
    )
    if (!result) throw new Error('Não foi possível salvar a sessão segura.')
    accessToken = {
        token: session.accessToken,
        expiresAt: session.accessTokenExpiresAt,
    }
}

export const getStoredSessionUserId = async () => {
    const stored = await Keychain.getGenericPassword({
        service: refreshTokenService,
    })
    return stored ? stored.username : null
}

export const clearAuthSession = async () => {
    accessToken = null
    await Keychain.resetGenericPassword({ service: refreshTokenService })
}

export const getValidAccessToken = async (): Promise<string | null> => {
    if (
        accessToken &&
        accessToken.expiresAt > Date.now() + accessTokenSafetyWindowMs
    ) {
        return accessToken.token
    }
    if (refreshInFlight) return refreshInFlight

    refreshInFlight = (async () => {
        const stored = await Keychain.getGenericPassword({
            service: refreshTokenService,
        })
        if (!stored) return null

        try {
            const refreshed = await authEndpoints.refresh(stored.password)
            await storeAuthSession(refreshed)
            return refreshed.accessToken
        } catch (error) {
            const status = (error as { response?: { status?: number } })
                .response?.status
            if (status === 401 || status === 403) await clearAuthSession()
            throw error
        }
    })()

    try {
        return await refreshInFlight
    } finally {
        refreshInFlight = null
    }
}

export const revokeAndClearAuthSession = async () => {
    const stored = await Keychain.getGenericPassword({
        service: refreshTokenService,
    })
    if (stored) {
        try {
            await authEndpoints.logout(stored.password)
        } catch {
            // Local logout must still work while offline; the session then idles out.
        }
    }
    await clearAuthSession()
}
