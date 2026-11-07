import { useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'

import {
    defaultNotificationPreferences,
    observeNotificationPreferences,
    saveNotificationPreferences,
    type NotificationPreferences,
} from '../../notifications/notificationPreferences'
import {
    getLocalNotificationPermission,
    openLocalNotificationSettings,
    requestLocalNotificationPermission,
} from '../../notifications/localNotifications'

export const useSettingsViewModel = (userId: string) => {
    const [preferences, setPreferences] = useState(
        defaultNotificationPreferences,
    )
    const preferencesRef = useRef(defaultNotificationPreferences)
    const [notificationAccess, setNotificationAccess] = useState<{
        hasPermission: boolean
        needsExactAlarmPermission: boolean
    } | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const setCurrentPreferences = (next: NotificationPreferences) => {
        preferencesRef.current = next
        setPreferences(next)
    }

    useEffect(() => {
        const subscription = observeNotificationPreferences(userId).subscribe({
            next: records => {
                const record = records[0]
                setCurrentPreferences(
                    record
                        ? {
                              notifyHabitStart: record.notifyHabitStart,
                              notifyDailyFocus: record.notifyDailyFocus,
                              notifyPriorityHabits: record.notifyPriorityHabits,
                              notifyLowSuccessHabits:
                                  record.notifyLowSuccessHabits ?? false,
                              minimumPriority:
                                  record.minimumPriority === 'low' ||
                                  record.minimumPriority === 'medium' ||
                                  record.minimumPriority === 'high'
                                      ? record.minimumPriority
                                      : null,
                          }
                        : defaultNotificationPreferences,
                )
            },
            error: () =>
                setErrorMessage('Unable to load notification settings.'),
        })

        return () => subscription.unsubscribe()
    }, [userId])

    useEffect(() => {
        let isActive = true
        const updatePermission = () => {
            getLocalNotificationPermission()
                .then(access => {
                    if (isActive) {
                        setNotificationAccess(access)
                    }
                })
                .catch(() => {
                    if (isActive)
                        setNotificationAccess({
                            hasPermission: false,
                            needsExactAlarmPermission: false,
                        })
                })
        }

        updatePermission()
        const appStateSubscription = AppState.addEventListener(
            'change',
            state => {
                if (state === 'active') updatePermission()
            },
        )

        return () => {
            isActive = false
            appStateSubscription.remove()
        }
    }, [])

    const updatePreference = async (
        changes: Partial<NotificationPreferences>,
    ) => {
        setErrorMessage(null)

        const isEnablingNotification =
            changes.notifyHabitStart === true ||
            changes.notifyDailyFocus === true ||
            changes.notifyPriorityHabits === true ||
            changes.notifyLowSuccessHabits === true

        if (
            isEnablingNotification &&
            (!notificationAccess?.hasPermission ||
                notificationAccess.needsExactAlarmPermission)
        ) {
            try {
                const access = await requestLocalNotificationPermission()
                setNotificationAccess(access)
                if (!access.hasPermission) {
                    return
                }
            } catch {
                setErrorMessage('Unable to request notification permission.')
                return
            }
        }

        const previousPreferences = preferencesRef.current
        const optimisticPreferences = {
            ...previousPreferences,
            ...changes,
        }
        setCurrentPreferences(optimisticPreferences)

        try {
            await saveNotificationPreferences(userId, changes)
        } catch {
            if (preferencesRef.current === optimisticPreferences)
                setCurrentPreferences(previousPreferences)
            setErrorMessage('Unable to save notification settings.')
        }
    }

    const togglePreference = async (
        preference:
            | 'notifyHabitStart'
            | 'notifyDailyFocus'
            | 'notifyPriorityHabits'
            | 'notifyLowSuccessHabits',
    ) => {
        await updatePreference({
            [preference]: !preferencesRef.current[preference],
        })
    }

    const openSystemNotificationSettings = async () => {
        try {
            await openLocalNotificationSettings(
                notificationAccess?.needsExactAlarmPermission ?? false,
            )
        } catch {
            setErrorMessage('Unable to open notification settings.')
        }
    }

    return {
        errorMessage,
        notificationAccess,
        openSystemNotificationSettings,
        preferences,
        togglePreference,
        updatePreference,
    }
}
