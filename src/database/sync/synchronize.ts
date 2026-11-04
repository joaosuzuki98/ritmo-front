import { synchronize } from '@nozbe/watermelondb/sync'

import { database } from '../index'
import { createApi } from '../../services/api'
import { createPullChanges } from './pullChanges'
import { createPushChanges } from './pushChanges'
import { preserveLocalAccess } from './preserveLocalAccess'

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
    const pullChanges = createPullChanges({ api, path: pullPath, getAuthToken })

    await synchronize({
        database,
        pullChanges: async args => preserveLocalAccess(await pullChanges(args)),
        pushChanges: createPushChanges({ api, path: pushPath, getAuthToken }),
        migrationsEnabledAtVersion: 1,
    })
}
