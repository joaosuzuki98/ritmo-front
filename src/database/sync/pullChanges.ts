import type { AxiosInstance } from 'axios'
import { z } from 'zod'
import type { SyncPullArgs, SyncPullResult } from '@nozbe/watermelondb/sync'

const changesSchema = z.record(
    z.string(),
    z.object({
        created: z.array(z.record(z.string(), z.unknown())),
        updated: z.array(z.record(z.string(), z.unknown())),
        deleted: z.array(z.string()),
    }),
)

const pullResponseSchema = z.object({
    changes: changesSchema,
    timestamp: z.number(),
})

type PullChangesOptions = {
    api: AxiosInstance
    path: string
    getAuthToken?: () => Promise<string | null>
}

export const createPullChanges =
    ({ api, path, getAuthToken }: PullChangesOptions) =>
    async ({
        lastPulledAt,
        schemaVersion,
        migration,
    }: SyncPullArgs): Promise<SyncPullResult> => {
        const token = await getAuthToken?.()
        const response = await api.get(path, {
            params: {
                last_pulled_at: lastPulledAt ?? null,
                schema_version: schemaVersion,
                migration: JSON.stringify(migration),
            },
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })

        return pullResponseSchema.parse(response.data)
    }
