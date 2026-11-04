import { database } from '../../src/database'
import { registerDailyAccess } from '../../src/database/registerDailyAccess'

jest.mock('../../src/database', () => ({
    database: { get: jest.fn(), write: jest.fn() },
}))

type AccessRecord = {
    totalAccessDays: number
    lastAccessDate?: string
    update: jest.Mock
}

describe('registerDailyAccess', () => {
    let users: Record<string, AccessRecord>
    let habits: { userId: string; status: string; name: string }[]

    beforeEach(() => {
        jest.useFakeTimers()
        jest.setSystemTime(new Date(2026, 10, 3, 23, 59))
        users = {}
        habits = [{ userId: 'one', status: 'active', name: 'Read' }]
        for (const id of ['one', 'two']) {
            users[id] = {
                totalAccessDays: 0,
                update: jest.fn(async (mutate: (user: AccessRecord) => void) =>
                    mutate(users[id]),
                ),
            }
        }
        jest.mocked(database.get).mockImplementation(((table: string) =>
            table === 'users'
                ? { find: async (id: string) => users[id] }
                : { query: () => ({ fetch: async () => habits }) }) as never)
        // WatermelonDB serializes writers, including concurrent app lifecycle events.
        let queue = Promise.resolve<unknown>(undefined)
        jest.mocked(database.write).mockImplementation(work => {
            const result = queue.then(() => work({} as never))
            queue = result.catch(() => undefined)
            return result as never
        })
    })

    afterEach(() => jest.useRealTimers())

    it('counts a day once across simultaneous calls, subsequent openings and separate users', async () => {
        const results = await Promise.all([
            registerDailyAccess('one'),
            registerDailyAccess('one'),
        ])
        expect(results.map(result => result.isFirstAccess)).toEqual([
            true,
            false,
        ])
        expect(results.every(result => result.hasHabits)).toBe(true)
        expect(results[0].totalAccessDays).toBe(1)
        expect(users.one.totalAccessDays).toBe(1)
        expect(users.one.lastAccessDate).toBe('2026-11-03')
        expect((await registerDailyAccess('one')).isFirstAccess).toBe(false)
        const secondUserAccess = await registerDailyAccess('two')
        expect(secondUserAccess.isFirstAccess).toBe(true)
        expect(secondUserAccess.hasHabits).toBe(false)
        expect(users.two.totalAccessDays).toBe(1)
    })

    it('increments at local midnight and counts one more day after a gap', async () => {
        await registerDailyAccess('one')
        jest.setSystemTime(new Date(2026, 10, 4, 0, 0))
        expect((await registerDailyAccess('one')).isFirstAccess).toBe(true)
        jest.setSystemTime(new Date(2026, 10, 20, 12))
        await registerDailyAccess('one')
        expect(users.one.totalAccessDays).toBe(3)
    })

    it('does not add another day when the device clock moves backwards', async () => {
        await registerDailyAccess('one')
        jest.setSystemTime(new Date(2026, 10, 2, 12))
        expect((await registerDailyAccess('one')).isFirstAccess).toBe(false)
        expect(users.one.totalAccessDays).toBe(1)
    })

    it('allows retrying a failed write without consuming the daily entry', async () => {
        users.one.update.mockRejectedValueOnce(new Error('Disk error'))
        await expect(registerDailyAccess('one')).rejects.toThrow('Disk error')
        expect((await registerDailyAccess('one')).isFirstAccess).toBe(true)
        expect(users.one.totalAccessDays).toBe(1)
    })

    it('requires at least one non-deleted, named habit to allow the daily screen', async () => {
        habits = [
            { userId: 'one', status: 'deleted', name: 'Old habit' },
            { userId: 'one', status: 'active', name: '  ' },
        ]
        const result = await registerDailyAccess('one')
        expect(result.isFirstAccess).toBe(true)
        expect(result.hasHabits).toBe(false)
        expect(result.totalAccessDays).toBe(1)

        habits.push({ userId: 'one', status: 'active', name: 'Walk' })
        jest.setSystemTime(new Date(2026, 10, 4, 9))
        const followingAccess = await registerDailyAccess('one')
        expect(followingAccess.isFirstAccess).toBe(true)
        expect(followingAccess.hasHabits).toBe(true)
        expect(followingAccess.totalAccessDays).toBe(2)
    })
})
