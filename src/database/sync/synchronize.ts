import { synchronize } from '@nozbe/watermelondb/sync'

import { database } from '../index'
import { createApi } from '../../services/api'
import { createPullChanges } from './pullChanges'
import { createPushChanges } from './pushChanges'

export type SynchronizeOptions = {
    baseUrl: string
    getAuthToken?: () => Promise<string | null>
    pullPath?: string
    pushPath?: string
}

export const synchronizeDatabase = async ({
    baseUrl,
    getAuthToken,
    pullPath = '/sync/pull',
    pushPath = '/sync/push',
}: SynchronizeOptions): Promise<void> => {
    const api = createApi({ baseUrl })

    await synchronize({
        database,
        pullChanges: createPullChanges({ api, path: pullPath, getAuthToken }),
        pushChanges: createPushChanges({ api, path: pushPath, getAuthToken }),
        migrationsEnabledAtVersion: 1,
    })
}
