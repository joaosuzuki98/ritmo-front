import { createPushChanges } from '../../src/database/sync/pushChanges'

describe('pushChanges', () => {
    it('filters local fields, read-only reasons, and unsupported user mutations', async () => {
        const post = jest.fn().mockResolvedValue({ data: {} })
        const pushChanges = createPushChanges({
            api: { post } as never,
            path: '/sync/push',
        })

        const result = await pushChanges({
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
                    deleted: ['user-3'],
                },
                incompletion_reasons: {
                    created: [{ id: 'reason-1', description: 'Other' }],
                    updated: [],
                    deleted: [],
                },
                completion_records: {
                    created: [
                        {
                            id: 'completion-1',
                            incompletion_reason_id: 'reason-1',
                        },
                    ],
                    updated: [],
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
                        created: [],
                        updated: [],
                        deleted: [],
                    },
                    completion_records: {
                        created: [],
                        updated: [],
                        deleted: [],
                    },
                },
                lastPulledAt: null,
            },
            { headers: undefined },
        )
        expect(post.mock.calls[0][1].changes).not.toHaveProperty(
            'incompletion_reasons',
        )
        expect(result.experimentalRejectedIds).toEqual({
            incompletion_reasons: ['reason-1'],
            completion_records: ['completion-1'],
        })
    })

    it('includes editable profile changes while filtering credentials', async () => {
        const post = jest.fn().mockResolvedValue({ status: 204, data: '' })
        const pushChanges = createPushChanges({
            api: { post } as never,
            path: '/sync/push',
        })

        await pushChanges({
            changes: {
                users: {
                    created: [],
                    updated: [
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
                    deleted: [],
                },
            },
            lastPulledAt: 1760000000000,
        } as never)

        expect(post).toHaveBeenCalledWith(
            '/sync/push',
            {
                changes: {
                    users: {
                        created: [],
                        updated: [
                            {
                                id: 'user-1',
                                name: 'Ana Silva',
                                mascot_name: 'Lua',
                                email: 'ana@example.com',
                                _changed: 'name,mascot_name,email',
                            },
                        ],
                        deleted: [],
                    },
                },
                lastPulledAt: 1760000000000,
            },
            { headers: undefined },
        )
    })

    it('returns successfully when the server responds with 204 and no body', async () => {
        const post = jest.fn().mockResolvedValue({ status: 204 })
        const pushChanges = createPushChanges({
            api: { post } as never,
            path: '/sync/push',
        })

        await expect(
            pushChanges({ changes: {}, lastPulledAt: null } as never),
        ).resolves.toEqual({})
    })

    it('rejects pushes above the server limit without sending a request', async () => {
        const post = jest.fn()
        const pushChanges = createPushChanges({
            api: { post } as never,
            path: '/sync/push',
        })

        await expect(
            pushChanges({
                changes: {
                    habits: {
                        created: Array.from({ length: 5001 }, (_, index) => ({
                            id: `habit-${index}`,
                        })),
                        updated: [],
                        deleted: [],
                    },
                },
                lastPulledAt: null,
            } as never),
        ).rejects.toThrow('Sync push exceeds the 5,000-change limit.')
        expect(post).not.toHaveBeenCalled()
    })

    it('uses the bearer token for push requests', async () => {
        const post = jest.fn().mockResolvedValue({ status: 204 })
        const pushChanges = createPushChanges({
            api: { post } as never,
            path: '/sync/push',
            getAuthToken: async () => 'access-token',
        })

        await pushChanges({ changes: {}, lastPulledAt: null } as never)

        expect(post).toHaveBeenCalledWith(
            '/sync/push',
            { changes: {}, lastPulledAt: null },
            { headers: { Authorization: 'Bearer access-token' } },
        )
    })
})
