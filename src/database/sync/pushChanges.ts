import type { AxiosInstance } from 'axios'
import { z } from 'zod'
import type { SyncPushArgs, SyncPushResult } from '@nozbe/watermelondb/sync'

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

export const createPushChanges =
    ({ api, path, getAuthToken }: PushChangesOptions) =>
    async ({
        changes,
        lastPulledAt,
    }: SyncPushArgs): Promise<SyncPushResult> => {
        const token = await getAuthToken?.()
        const response = await api.post(
            path,
            {
                changes,
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
