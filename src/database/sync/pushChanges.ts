import type { AxiosInstance } from 'axios'
import { z } from 'zod'
import type { DirtyRaw } from '@nozbe/watermelondb/RawRecord'
import type {
    SyncDatabaseChangeSet,
    SyncPushArgs,
    SyncPushResult,
    SyncTableChangeSet,
} from '@nozbe/watermelondb/sync'

const maxPushChanges = 5000

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
    'total_access_days',
    'last_access_date',
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
            created: [],
            updated,
            deleted: [],
        },
    }
}

const removeReadOnlyChanges = (
    changes: SyncDatabaseChangeSet,
): SyncDatabaseChangeSet => {
    const writableChanges = {
        ...(changes as Record<string, SyncTableChangeSet>),
    }
    delete writableChanges.incompletion_reasons
    return writableChanges as SyncDatabaseChangeSet
}

const removeLocalNotificationPreferenceChanges = (
    changes: SyncDatabaseChangeSet,
): SyncDatabaseChangeSet => {
    const localChanges = {
        ...(changes as Record<string, SyncTableChangeSet>),
    }
    delete localChanges.notification_preferences
    return localChanges as SyncDatabaseChangeSet
}

const removeChangesWithLocalReasonIds = (changes: SyncDatabaseChangeSet) => {
    const localChanges = changes as Record<string, SyncTableChangeSet>
    const localReasons = localChanges.incompletion_reasons
    if (!localReasons) return { changes, rejectedIds: {} }

    const localReasonIds = new Set([
        ...localReasons.created.map(record => record.id),
        ...localReasons.updated.map(record => record.id),
        ...localReasons.deleted,
    ])
    const completionRecords = localChanges.completion_records
    if (!completionRecords || !localReasonIds.size) {
        return {
            changes,
            rejectedIds: { incompletion_reasons: [...localReasonIds] },
        }
    }

    const rejectedCompletionIds = [
        ...completionRecords.created,
        ...completionRecords.updated,
    ]
        .filter(
            record =>
                typeof record.incompletion_reason_id === 'string' &&
                localReasonIds.has(record.incompletion_reason_id),
        )
        .map(record => record.id)
    const rejectedIds: Record<string, string[]> = {
        incompletion_reasons: [...localReasonIds],
    }
    if (rejectedCompletionIds.length) {
        rejectedIds.completion_records = rejectedCompletionIds
    }

    return {
        changes: {
            ...changes,
            completion_records: {
                ...completionRecords,
                created: completionRecords.created.filter(
                    record => !rejectedCompletionIds.includes(record.id),
                ),
                updated: completionRecords.updated.filter(
                    record => !rejectedCompletionIds.includes(record.id),
                ),
            },
        } as SyncDatabaseChangeSet,
        rejectedIds,
    }
}

const countChanges = (changes: SyncDatabaseChangeSet): number =>
    Object.values(changes as Record<string, SyncTableChangeSet>).reduce(
        (total, table) =>
            total +
            table.created.length +
            table.updated.length +
            table.deleted.length,
        0,
    )

export const createPushChanges =
    ({ api, path, getAuthToken }: PushChangesOptions) =>
    async ({
        changes,
        lastPulledAt,
    }: SyncPushArgs): Promise<SyncPushResult> => {
        const { changes: changesWithoutLocalReasonRefs, rejectedIds } =
            removeChangesWithLocalReasonIds(
                removeLocalNotificationPreferenceChanges(
                    removeLocalUserChanges(changes),
                ),
            )
        const safeChanges = removeReadOnlyChanges(changesWithoutLocalReasonRefs)
        if (countChanges(safeChanges) > maxPushChanges) {
            throw new Error('Sync push exceeds the 5,000-change limit.')
        }

        const token = await getAuthToken?.()
        const response = await api.post(
            path,
            {
                changes: safeChanges,
                lastPulledAt,
            },
            {
                headers: token
                    ? { Authorization: `Bearer ${token}` }
                    : undefined,
            },
        )

        const pushResult =
            response.status === 204 || response.data == null
                ? {}
                : pushResponseSchema.parse(response.data)
        if (Object.keys(rejectedIds).length === 0) return pushResult

        const serverRejectedIds = pushResult.experimentalRejectedIds ?? {}
        return {
            ...pushResult,
            experimentalRejectedIds: Object.fromEntries(
                Object.entries({ ...serverRejectedIds, ...rejectedIds }).map(
                    ([table, ids]) => [
                        table,
                        [
                            ...new Set([
                                ...(serverRejectedIds[table] ?? []),
                                ...(ids ?? []),
                            ]),
                        ],
                    ],
                ),
            ),
        }
    }
