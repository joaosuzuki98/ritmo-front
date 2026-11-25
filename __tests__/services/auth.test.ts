import { database } from '../../src/database'
import { authenticateUser, requestPasswordReset } from '../../src/services/auth'
import { authEndpoints } from '../../src/services/endpoints/auth'
import { translate } from '../../src/localization/translations'

jest.mock('../../src/database', () => ({ database: { get: jest.fn() } }))
jest.mock('../../src/services/endpoints/auth', () => ({
    authEndpoints: { login: jest.fn(), requestPasswordReset: jest.fn() },
}))
jest.mock('../../src/services/authSession', () => ({
    clearAuthSession: jest.fn(),
    getStoredSessionUserId: jest.fn(),
    revokeAndClearAuthSession: jest.fn(),
    storeAuthSession: jest.fn(),
}))

describe('authentication errors', () => {
    beforeEach(() => jest.clearAllMocks())

    it.each([
        { detail: 'Email não encontrado.' },
        { detail: 'Senha incorreta.' },
    ])('uses the same generic message for login 401 responses', async data => {
        jest.mocked(authEndpoints.login).mockRejectedValue({
            isAxiosError: true,
            response: { status: 401, data },
        })

        await expect(
            authenticateUser('person@example.com', 'wrong-password'),
        ).rejects.toThrow('Incorrect login details.')
        expect(database.get).not.toHaveBeenCalled()
    })

    it('translates the generic message without identifying a field', () => {
        expect(translate('Incorrect login details.', 'pt')).toBe(
            'Dados de acesso incorretos.',
        )
        expect(translate('Incorrect login details.', 'en')).toBe(
            'Incorrect login details.',
        )
    })

    it('preserves the connection-error feedback', async () => {
        jest.mocked(authEndpoints.login).mockRejectedValue({
            isAxiosError: true,
        })

        await expect(
            authenticateUser('person@example.com', 'password'),
        ).rejects.toThrow('Conecte-se à internet e tente novamente.')
    })

    it('does not change 401 handling for password recovery', async () => {
        const error = Object.assign(new Error('Recovery error'), {
            isAxiosError: true,
            response: { status: 401, data: {} },
        })
        jest.mocked(authEndpoints.requestPasswordReset).mockRejectedValue(error)

        await expect(
            requestPasswordReset('person@example.com'),
        ).rejects.toThrow('Recovery error')
    })
})
