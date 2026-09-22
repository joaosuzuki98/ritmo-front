import { AppState, type AppStateStatus } from 'react-native'
import NetInfo from '@react-native-community/netinfo'

import { synchronizeDatabase, type SynchronizeOptions } from './synchronize'

export type SyncManagerOptions = SynchronizeOptions & {
    onError?: (error: unknown) => void
}

export const createSyncManager = ({
    onError,
    ...synchronizeOptions
}: SyncManagerOptions) => {
    let isSyncing = false
    let wasConnected = false
    let removeAppStateListener: (() => void) | undefined
    let removeNetworkListener: (() => void) | undefined

    const runSynchronization = async (): Promise<void> => {
        if (isSyncing) return

        isSyncing = true
        try {
            await synchronizeDatabase(synchronizeOptions)
        } finally {
            isSyncing = false
        }
    }

    const triggerSynchronization = (): void => {
        runSynchronization().catch(error => onError?.(error))
    }

    const handleAppStateChange = (state: AppStateStatus): void => {
        if (state === 'active') triggerSynchronization()
    }

    const start = (): void => {
        removeAppStateListener = AppState.addEventListener(
            'change',
            handleAppStateChange,
        ).remove
        removeNetworkListener = NetInfo.addEventListener(state => {
            const isConnected = state.isConnected === true
            if (isConnected && !wasConnected) triggerSynchronization()
            wasConnected = isConnected
        })
        triggerSynchronization()
    }

    const stop = (): void => {
        removeAppStateListener?.()
        removeNetworkListener?.()
        removeAppStateListener = undefined
        removeNetworkListener = undefined
    }

    return { runSynchronization, start, stop }
}
