import { Q } from '@nozbe/watermelondb'
import type {
    SyncPullResult,
    SyncTableChangeSet,
} from '@nozbe/watermelondb/sync'

import { database, type User } from '../index'

export const preserveLocalAccess = async (
    result: SyncPullResult,
): Promise<SyncPullResult> => {
    if (!('changes' in result)) return result
    const users = (result.changes as Record<string, SyncTableChangeSet>).users
    if (!users) return result

    const records = [...users.created, ...users.updated]
    if (!records.length) return result
    const localUsers = await database
        .get<User>('users')
        .query(Q.where('id', Q.oneOf(records.map(record => record.id))))
        .fetch()
    const byId = new Map(localUsers.map(user => [user.id, user]))
    const preserve = (record: (typeof records)[number]) => {
        const localUser = byId.get(record.id)
        return {
            ...record,
            total_access_days: localUser?.totalAccessDays ?? 0,
            last_access_date: localUser?.lastAccessDate ?? null,
        }
    }

    // Device-local visits must survive remote profile updates, even after a push.
    return {
        ...result,
        changes: {
            ...result.changes,
            users: {
                ...users,
                created: users.created.map(preserve),
                updated: users.updated.map(preserve),
            },
        },
    }
}
