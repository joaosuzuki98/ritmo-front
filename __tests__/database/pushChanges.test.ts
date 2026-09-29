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
                                'name,email,password_hash,password_salt,is_logged_in',
                            password_hash: 'private-hash',
                            password_salt: 'private-salt',
                            is_logged_in: true,
                        },
                    ],
                    updated: [
                        {
                            id: 'user-2',
                            _changed: 'is_logged_in,updated_at',
                            is_logged_in: false,
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
})
