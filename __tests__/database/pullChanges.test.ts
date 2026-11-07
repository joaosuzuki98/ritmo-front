import { createPullChanges } from '../../src/database/sync/pullChanges'

describe('pullChanges', () => {
    it('posts the initial pull cursor with the bearer token and keeps read-only data', async () => {
        const data = {
            changes: {
                incompletion_reasons: {
                    created: [{ id: 'reason-1', description: 'Other' }],
                    updated: [],
                    deleted: [],
                },
            },
            timestamp: 1760000000000,
        }
        const post = jest.fn().mockResolvedValue({ data })
        const pullChanges = createPullChanges({
            api: { post } as never,
            path: '/sync/pull',
            getAuthToken: async () => 'access-token',
        })

        const result = await pullChanges({
            lastPulledAt: null,
            schemaVersion: 14,
            migration: null,
        } as never)

        expect(post).toHaveBeenCalledWith(
            '/sync/pull',
            { lastPulledAt: null },
            { headers: { Authorization: 'Bearer access-token' } },
        )
        expect(result).toEqual(data)
    })

    it('posts the previous timestamp as the next pull cursor', async () => {
        const post = jest.fn().mockResolvedValue({
            data: { changes: {}, timestamp: 1760000000001 },
        })
        const pullChanges = createPullChanges({
            api: { post } as never,
            path: '/sync/pull',
        })

        await pullChanges({
            lastPulledAt: 1760000000000,
            schemaVersion: 14,
            migration: null,
        } as never)

        expect(post).toHaveBeenCalledWith(
            '/sync/pull',
            { lastPulledAt: 1760000000000 },
            { headers: undefined },
        )
    })
})
