import * as Keychain from 'react-native-keychain'

import {
    clearAuthSession,
    getValidAccessToken,
    storeAuthSession,
} from '../../src/services/authSession'
import { authEndpoints } from '../../src/services/endpoints/auth'
import type { AuthResponse } from '../../src/services/endpoints/auth'

jest.mock('react-native-keychain', () => ({
    ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'device-only' },
    getGenericPassword: jest.fn(),
    resetGenericPassword: jest.fn(),
    setGenericPassword: jest.fn(),
}))

jest.mock('../../src/services/endpoints/auth', () => ({
    authEndpoints: { refresh: jest.fn() },
}))

const createSession = (
    overrides: Partial<AuthResponse> = {},
): AuthResponse => ({
    user: {
        id: 'user-1',
        name: 'Ana Silva',
        mascotName: 'Lua',
        email: 'ana@example.com',
        totalPoints: 0,
        level: 1,
        createdAt: 1,
        updatedAt: 1,
    },
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    accessTokenExpiresAt: Date.now() + 60_000,
    refreshTokenIdleExpiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000,
    ...overrides,
})

describe('authSession', () => {
    beforeEach(async () => {
        jest.clearAllMocks()
        jest.mocked(Keychain.setGenericPassword).mockResolvedValue({
            service: 'com.ritmo.auth.refresh-token',
            storage: 'keychain',
        } as never)
        jest.mocked(Keychain.resetGenericPassword).mockResolvedValue(true)
        await clearAuthSession()
        jest.clearAllMocks()
    })

    it('stores only the refresh token in device-only secure storage', async () => {
        const session = createSession()
        await storeAuthSession(session)

        expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
            'user-1',
            'refresh-token',
            {
                service: 'com.ritmo.auth.refresh-token',
                accessible: 'device-only',
            },
        )
        await expect(getValidAccessToken()).resolves.toBe('access-token')
        expect(authEndpoints.refresh).not.toHaveBeenCalled()
    })

    it('rotates an expired access token and persists the new refresh token', async () => {
        const session = createSession({
            accessTokenExpiresAt: Date.now() + 1_000,
        })
        await storeAuthSession(session)
        jest.mocked(Keychain.getGenericPassword).mockResolvedValue({
            username: 'user-1',
            password: 'refresh-token',
            service: 'com.ritmo.auth.refresh-token',
            storage: 'keychain',
        } as never)
        const refreshedSession = createSession({
            accessToken: 'new-access-token',
            refreshToken: 'rotated-refresh-token',
        })
        jest.mocked(authEndpoints.refresh).mockResolvedValue(refreshedSession)

        await expect(getValidAccessToken()).resolves.toBe('new-access-token')
        expect(authEndpoints.refresh).toHaveBeenCalledWith('refresh-token')
        expect(Keychain.setGenericPassword).toHaveBeenLastCalledWith(
            'user-1',
            'rotated-refresh-token',
            expect.objectContaining({
                service: 'com.ritmo.auth.refresh-token',
            }),
        )
    })

    it('shares concurrent refresh requests', async () => {
        await storeAuthSession(
            createSession({ accessTokenExpiresAt: Date.now() + 1_000 }),
        )
        jest.mocked(Keychain.getGenericPassword).mockResolvedValue({
            username: 'user-1',
            password: 'refresh-token',
            service: 'com.ritmo.auth.refresh-token',
            storage: 'keychain',
        } as never)
        jest.mocked(authEndpoints.refresh).mockResolvedValue(
            createSession({ accessToken: 'new-access-token' }),
        )

        await expect(
            Promise.all([getValidAccessToken(), getValidAccessToken()]),
        ).resolves.toEqual(['new-access-token', 'new-access-token'])
        expect(authEndpoints.refresh).toHaveBeenCalledTimes(1)
    })
})
