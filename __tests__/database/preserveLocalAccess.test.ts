import { database } from '../../src/database'
import type { SyncTableChangeSet } from '@nozbe/watermelondb/sync'
import { preserveLocalAccess } from '../../src/database/sync/preserveLocalAccess'

jest.mock('../../src/database', () => ({ database: { get: jest.fn() } }))

it('preserves local visits on a remote profile update and starts imported accounts at zero', async () => {
    jest.mocked(database.get).mockReturnValue({
        query: () => ({
            fetch: async () => [
                {
                    id: 'existing',
                    totalAccessDays: 7,
                    lastAccessDate: '2026-11-03',
                },
            ],
        }),
    } as never)
    const result = await preserveLocalAccess({
        timestamp: 123,
        changes: {
            users: {
                created: [{ id: 'new', name: 'New', total_access_days: 99 }],
                updated: [
                    { id: 'existing', name: 'Updated', total_access_days: 0 },
                ],
                deleted: [],
            },
        },
    })
    if (!('changes' in result)) throw new Error('Expected parsed changes')
    const users = (result.changes as Record<string, SyncTableChangeSet>).users
    expect(users.created[0]).toMatchObject({
        total_access_days: 0,
        last_access_date: null,
    })
    expect(users.updated[0]).toMatchObject({
        name: 'Updated',
        total_access_days: 7,
        last_access_date: '2026-11-03',
    })
})
