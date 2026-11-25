import { synchronize } from '@nozbe/watermelondb/sync'
import { synchronizeDatabase } from '../../src/database/sync/synchronize'

jest.mock('@nozbe/watermelondb/sync', () => ({ synchronize: jest.fn() }))
jest.mock('../../src/database', () => ({ database: {} }))
jest.mock('../../src/services/api', () => ({ createApi: jest.fn(() => ({})) }))
jest.mock('../../src/services/authSession', () => ({
    getValidAccessToken: jest.fn(),
}))
jest.mock('../../src/database/sync/pullChanges', () => ({
    createPullChanges: jest.fn(() => jest.fn()),
}))
jest.mock('../../src/database/sync/pushChanges', () => ({
    createPushChanges: jest.fn(() => jest.fn()),
}))

describe('synchronizeDatabase coordination', () => {
    const mockSynchronize = jest.mocked(synchronize)

    beforeEach(() => jest.clearAllMocks())

    it('waits for an in-flight sync and then runs a fresh sync', async () => {
        let completeFirst: () => void = () => undefined
        mockSynchronize
            .mockImplementationOnce(
                () =>
                    new Promise<void>(resolve => {
                        completeFirst = resolve
                    }),
            )
            .mockResolvedValueOnce(undefined)

        const first = synchronizeDatabase({ baseUrl: 'https://example.test' })
        const second = synchronizeDatabase({ baseUrl: 'https://example.test' })
        expect(mockSynchronize).toHaveBeenCalledTimes(1)
        completeFirst()
        await Promise.all([first, second])
        expect(mockSynchronize).toHaveBeenCalledTimes(2)
    })

    it('attempts a fresh sync after a previous failure', async () => {
        let failFirst: (error: Error) => void = () => undefined
        mockSynchronize
            .mockImplementationOnce(
                () =>
                    new Promise<void>((_, reject) => {
                        failFirst = reject
                    }),
            )
            .mockResolvedValueOnce(undefined)
        const first = synchronizeDatabase({ baseUrl: 'https://example.test' })
        const second = synchronizeDatabase({ baseUrl: 'https://example.test' })
        const firstFailure = first.then(
            () => null,
            (error: unknown) => error,
        )
        failFirst(new Error('failed'))
        expect(await firstFailure).toEqual(new Error('failed'))
        await expect(second).resolves.toBeUndefined()
        expect(mockSynchronize).toHaveBeenCalledTimes(2)
    })
})
