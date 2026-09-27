import {
    authenticateLocalUser,
    deriveLocalPasswordHash,
    logoutLocalUser,
    registerLocalUser,
    restoreLocalSession,
} from '../../src/database/localAuth'
import { database } from '../../src/database/index'

jest.mock('../../src/database/index', () => ({
    database: {
        get: jest.fn(),
        write: jest.fn(),
    },
}))

type UserRecord = {
    id: string
    name: string
    email: string
    legacyPassword?: string
    passwordHash?: string
    passwordSalt?: string
    totalPoints: number
    level: number
    isLoggedIn?: boolean
    update: (mutate: (record: UserRecord) => void) => Promise<UserRecord>
}

const mockedGet = database.get as jest.Mock
const mockedWrite = database.write as jest.Mock

describe('local authentication', () => {
    let users: UserRecord[]
    let collection: {
        query: jest.Mock
        create: jest.Mock
        find: jest.Mock
    }

    const createUser = (overrides: Partial<UserRecord> = {}): UserRecord => {
        const user: UserRecord = {
            id: 'user-1',
            name: 'Ana Silva',
            email: 'ana@example.com',
            totalPoints: 0,
            level: 1,
            isLoggedIn: false,
            update: async (
                mutate: (record: UserRecord) => void,
            ): Promise<UserRecord> => {
                mutate(user)
                return user
            },
            ...overrides,
        }
        return user
    }

    beforeEach(() => {
        jest.clearAllMocks()
        users = []
        collection = {
            query: jest.fn(() => ({
                fetch: jest.fn().mockResolvedValue(users),
            })),
            create: jest.fn(async (prepare: (record: UserRecord) => void) => {
                const user = createUser({
                    id: 'created-user',
                    name: '',
                    email: '',
                    isLoggedIn: false,
                })
                prepare(user)
                users.push(user)
                return user
            }),
            find: jest.fn(async (id: string) => {
                const user = users.find(item => item.id === id)
                if (!user) throw new Error('User not found')
                return user
            }),
        }
        mockedGet.mockReturnValue(collection)
        mockedWrite.mockImplementation(
            async (operation: () => Promise<unknown>) => operation(),
        )
    })

    it('creates an active local account without adding sample records', async () => {
        const user = await registerLocalUser({
            name: '  Ana Silva  ',
            email: ' ANA@Example.com ',
            password: 'password123',
        })
        expect(user.passwordHash).not.toBe('password123')

        expect(user).toMatchObject({
            id: 'created-user',
            name: 'Ana Silva',
            email: 'ana@example.com',
            passwordHash: expect.any(String),
            passwordSalt: expect.any(String),
            isLoggedIn: true,
            totalPoints: 0,
            level: 1,
        })
        expect(mockedGet).toHaveBeenCalledTimes(2)
        expect(mockedGet).toHaveBeenNthCalledWith(1, 'users')
        expect(mockedGet).toHaveBeenNthCalledWith(2, 'users')
    })

    it('rejects duplicate emails regardless of letter case', async () => {
        users.push(createUser())

        await expect(
            registerLocalUser({
                name: 'Outra pessoa',
                email: 'ANA@EXAMPLE.COM',
                password: 'password456',
            }),
        ).rejects.toThrow('Já existe uma conta com este e-mail.')

        expect(collection.create).not.toHaveBeenCalled()
    })

    it('authenticates by email and password and persists the active session', async () => {
        const passwordSalt = 'user-salt'
        const user = createUser({
            passwordHash: await deriveLocalPasswordHash(
                'password123',
                passwordSalt,
            ),
            passwordSalt,
        })
        const otherUser = createUser({
            id: 'user-2',
            name: 'Outra pessoa',
            email: 'other@example.com',
            isLoggedIn: true,
        })
        users.push(user, otherUser)

        const authenticatedUser = await authenticateLocalUser(
            ' ANA@EXAMPLE.COM ',
            'password123',
        )

        expect(authenticatedUser).toBe(user)
        expect(user.isLoggedIn).toBe(true)
        expect(otherUser.isLoggedIn).toBe(false)
    })

    it('rejects an incorrect local password', async () => {
        const passwordSalt = 'user-salt'
        users.push(
            createUser({
                passwordHash: await deriveLocalPasswordHash(
                    'password123',
                    passwordSalt,
                ),
                passwordSalt,
            }),
        )

        await expect(
            authenticateLocalUser('ana@example.com', 'incorrect'),
        ).rejects.toThrow('E-mail ou senha incorretos.')
    })

    it('upgrades an existing local password to a salted hash on login', async () => {
        const user = createUser({ legacyPassword: 'legacy-password' })
        users.push(user)

        await authenticateLocalUser('ana@example.com', 'legacy-password')

        expect(user.passwordHash).toEqual(expect.any(String))
        expect(user.passwordSalt).toEqual(expect.any(String))
        expect(user.legacyPassword).toBeUndefined()
        expect(user.isLoggedIn).toBe(true)
    })

    it('restores an active local session and clears it on logout', async () => {
        const user = createUser({ isLoggedIn: true })
        users.push(user)

        await expect(restoreLocalSession()).resolves.toBe(user)
        await logoutLocalUser(user.id)

        expect(user.isLoggedIn).toBe(false)
        await expect(restoreLocalSession()).resolves.toBeNull()
    })
})
