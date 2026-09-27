import type { AxiosInstance } from 'axios'
import { z } from 'zod'
import type { DirtyRaw } from '@nozbe/watermelondb/RawRecord'
import type {
    SyncDatabaseChangeSet,
    SyncPushArgs,
    SyncPushResult,
    SyncTableChangeSet,
} from '@nozbe/watermelondb/sync'

const pushResponseSchema = z
    .object({
        experimentalRejectedIds: z
            .record(z.string(), z.array(z.string()))
            .optional(),
    })
    .passthrough()

type PushChangesOptions = {
    api: AxiosInstance
    path: string
    getAuthToken?: () => Promise<string | null>
}

const localUserFields = [
    'password',
    'password_hash',
    'password_salt',
    'is_logged_in',
]

const removeLocalUserFields = (record: DirtyRaw): DirtyRaw => {
    const sanitizedRecord = { ...record }
    for (const field of localUserFields) delete sanitizedRecord[field]
    if (typeof sanitizedRecord._changed === 'string') {
        sanitizedRecord._changed = sanitizedRecord._changed
            .split(',')
            .filter(field => !localUserFields.includes(field))
            .join(',')
    }
    return sanitizedRecord
}

const removeLocalUserChanges = (
    changes: SyncDatabaseChangeSet,
): SyncDatabaseChangeSet => {
    const userChanges = (changes as Record<string, SyncTableChangeSet>).users
    if (!userChanges) return changes

    const updated = userChanges.updated.flatMap(record => {
        const changedFields =
            typeof record._changed === 'string'
                ? record._changed.split(',').filter(Boolean)
                : []
        const hasProfileChange = changedFields.some(
            field => !localUserFields.includes(field) && field !== 'updated_at',
        )
        if (!hasProfileChange) return []

        const sanitizedRecord = removeLocalUserFields(record)
        sanitizedRecord._changed = changedFields
            .filter(field => !localUserFields.includes(field))
            .join(',')
        return [sanitizedRecord]
    })

    return {
        ...changes,
        users: {
            ...userChanges,
            created: userChanges.created.map(removeLocalUserFields),
            updated,
        },
    }
}

export const createPushChanges =
    ({ api, path, getAuthToken }: PushChangesOptions) =>
    async ({
        changes,
        lastPulledAt,
    }: SyncPushArgs): Promise<SyncPushResult> => {
        const token = await getAuthToken?.()
        const safeChanges = removeLocalUserChanges(changes)
        const response = await api.post(
            path,
            {
                changes: safeChanges,
                last_pulled_at: lastPulledAt,
            },
            {
                headers: token
                    ? { Authorization: `Bearer ${token}` }
                    : undefined,
            },
        )

        return pushResponseSchema.parse(response.data ?? {})
    }
