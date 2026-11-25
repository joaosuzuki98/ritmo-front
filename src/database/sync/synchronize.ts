import { synchronize } from '@nozbe/watermelondb/sync'

import { database } from '../index'
import { createApi } from '../../services/api'
import { getValidAccessToken } from '../../services/authSession'
import { createPullChanges } from './pullChanges'
import { createPushChanges } from './pushChanges'
import { preserveLocalAccess } from './preserveLocalAccess'

export type SynchronizeOptions = {
    baseUrl: string
    getAuthToken?: () => Promise<string | null>
    pullPath?: string
    pushPath?: string
}

let lastSynchronization: Promise<void> | undefined

export const synchronizeDatabase = async ({
    baseUrl,
    getAuthToken = getValidAccessToken,
    pullPath = '/sync/pull',
    pushPath = '/sync/push',
}: SynchronizeOptions): Promise<void> => {
    const previous = lastSynchronization
    const current = (async () => {
        if (previous) {
            try {
                await previous
            } catch {
                // A new synchronization must still be attempted after a failure.
            }
        }
        const api = createApi({ baseUrl })
        const pullChanges = createPullChanges({
            api,
            path: pullPath,
            getAuthToken,
        })
        await synchronize({
            database,
            pullChanges: async args =>
                preserveLocalAccess(await pullChanges(args)),
            pushChanges: createPushChanges({
                api,
                path: pushPath,
                getAuthToken,
            }),
            migrationsEnabledAtVersion: 1,
        })
    })()
    lastSynchronization = current
    try {
        await current
    } finally {
        if (lastSynchronization === current) lastSynchronization = undefined
    }
}
