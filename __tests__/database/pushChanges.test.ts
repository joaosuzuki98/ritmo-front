import { createPushChanges } from '../../src/database/sync/pushChanges'

describe('pushChanges', () => {
    it('never sends local account credentials or session state to sync', async () => {
        const post = jest.fn().mockResolvedValue({ data: {} })
        const pushChanges = createPushChanges({
            api: { post } as never,
            path: '/sync/push',
        })

        await pushChanges({
            changes: {
                users: {
                    created: [
                        {
                            id: 'user-1',
                            name: 'Ana Silva',
                            email: 'ana@example.com',
                            _changed:
                                'name,email,password,password_hash,password_salt,is_logged_in,total_access_days,last_access_date',
                            password: 'private-password',
                            password_hash: 'private-hash',
                            password_salt: 'private-salt',
                            is_logged_in: true,
                            total_access_days: 12,
                            last_access_date: '2026-11-03',
                        },
                    ],
                    updated: [
                        {
                            id: 'user-2',
                            _changed:
                                'is_logged_in,updated_at,total_access_days,last_access_date',
                            is_logged_in: false,
                            total_access_days: 8,
                            last_access_date: '2026-11-03',
                            updated_at: 123,
                        },
                    ],
                    deleted: [],
                },
            },
            lastPulledAt: null,
        } as never)

        expect(post).toHaveBeenCalledWith(
            '/sync/push',
            {
                changes: {
                    users: {
                        created: [
                            {
                                id: 'user-1',
                                name: 'Ana Silva',
                                email: 'ana@example.com',
                                _changed: 'name,email',
                            },
                        ],
                        updated: [],
                        deleted: [],
                    },
                },
                last_pulled_at: null,
            },
            { headers: undefined },
        )
    })

    it('includes the mascot name as profile data while filtering credentials', async () => {
        const post = jest.fn().mockResolvedValue({ data: {} })
        const pushChanges = createPushChanges({
            api: { post } as never,
            path: '/sync/push',
        })

        await pushChanges({
            changes: {
                users: {
                    created: [
                        {
                            id: 'user-1',
                            name: 'Ana Silva',
                            mascot_name: 'Lua',
                            email: 'ana@example.com',
                            password: 'local-password',
                            _changed:
                                'name,mascot_name,email,password,password_hash,password_salt',
                            password_hash: 'private-hash',
                            password_salt: 'private-salt',
                        },
                    ],
                    updated: [],
                    deleted: [],
                },
            },
            lastPulledAt: null,
        } as never)

        expect(post.mock.calls[0][1].changes.users.created[0]).toEqual({
            id: 'user-1',
            name: 'Ana Silva',
            mascot_name: 'Lua',
            email: 'ana@example.com',
            _changed: 'name,mascot_name,email',
        })
    })
})
