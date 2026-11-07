import { Q } from '@nozbe/watermelondb'

import { database, type NotificationPreference } from '../database'
import type { PriorityCode } from '../constants/priorities'

export type NotificationPreferences = {
    notifyHabitStart: boolean
    notifyDailyFocus: boolean
    notifyPriorityHabits: boolean
    notifyLowSuccessHabits: boolean
    minimumPriority: PriorityCode | null
}

export type LowSuccessNotificationRecord = {
    isLowEpisode: boolean
    notifiedInEpisode: boolean
    lastNotifiedAt?: number
    pending: boolean
}

export type LowSuccessNotificationState = Record<
    string,
    LowSuccessNotificationRecord
>

export const defaultNotificationPreferences: NotificationPreferences = {
    notifyHabitStart: false,
    notifyDailyFocus: false,
    notifyPriorityHabits: false,
    notifyLowSuccessHabits: false,
    minimumPriority: null,
}

export const observeNotificationPreferences = (userId: string) =>
    database
        .get<NotificationPreference>('notification_preferences')
        .query(Q.where('user_id', userId))
        .observeWithColumns([
            'notify_habit_start',
            'notify_daily_focus',
            'notify_priority_habits',
            'notify_low_success_habits',
            'minimum_priority',
        ])

export const saveNotificationPreferences = async (
    userId: string,
    changes: Partial<NotificationPreferences>,
): Promise<void> => {
    const collection = database.get<NotificationPreference>(
        'notification_preferences',
    )

    await database.write(async () => {
        const existing = await collection
            .query(Q.where('user_id', userId))
            .fetch()
        const now = new Date()

        if (existing[0]) {
            await existing[0].update(record => {
                if (changes.notifyHabitStart !== undefined)
                    record.notifyHabitStart = changes.notifyHabitStart
                if (changes.notifyDailyFocus !== undefined)
                    record.notifyDailyFocus = changes.notifyDailyFocus
                if (changes.notifyPriorityHabits !== undefined)
                    record.notifyPriorityHabits = changes.notifyPriorityHabits
                if (changes.notifyLowSuccessHabits !== undefined)
                    record.notifyLowSuccessHabits =
                        changes.notifyLowSuccessHabits
                if (changes.minimumPriority !== undefined)
                    record.minimumPriority =
                        changes.minimumPriority ?? undefined
                record.updatedAt = now
            })
            return
        }

        await collection.create(record => {
            record.userId = userId
            record.notifyHabitStart =
                changes.notifyHabitStart ??
                defaultNotificationPreferences.notifyHabitStart
            record.notifyDailyFocus =
                changes.notifyDailyFocus ??
                defaultNotificationPreferences.notifyDailyFocus
            record.notifyPriorityHabits =
                changes.notifyPriorityHabits ??
                defaultNotificationPreferences.notifyPriorityHabits
            record.notifyLowSuccessHabits =
                changes.notifyLowSuccessHabits ??
                defaultNotificationPreferences.notifyLowSuccessHabits
            record.minimumPriority =
                changes.minimumPriority ??
                defaultNotificationPreferences.minimumPriority ??
                undefined
            record.createdAt = now
            record.updatedAt = now
        })
    })
}

export const parseLowSuccessNotificationState = (
    serialized?: string,
): LowSuccessNotificationState => {
    if (!serialized) return {}

    try {
        const parsed: unknown = JSON.parse(serialized)
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
            return {}

        return Object.fromEntries(
            Object.entries(parsed).flatMap(([habitId, value]) => {
                if (!value || typeof value !== 'object') return []
                const state = value as Partial<LowSuccessNotificationRecord>
                if (
                    typeof state.isLowEpisode !== 'boolean' ||
                    typeof state.notifiedInEpisode !== 'boolean' ||
                    typeof state.pending !== 'boolean'
                )
                    return []

                return [
                    [
                        habitId,
                        {
                            isLowEpisode: state.isLowEpisode,
                            notifiedInEpisode: state.notifiedInEpisode,
                            pending: state.pending,
                            ...(typeof state.lastNotifiedAt === 'number'
                                ? { lastNotifiedAt: state.lastNotifiedAt }
                                : {}),
                        },
                    ],
                ]
            }),
        )
    } catch {
        return {}
    }
}

export const saveLowSuccessNotificationState = async (
    userId: string,
    state: LowSuccessNotificationState,
): Promise<void> => {
    const collection = database.get<NotificationPreference>(
        'notification_preferences',
    )

    await database.write(async () => {
        const existing = await collection
            .query(Q.where('user_id', userId))
            .fetch()
        const now = new Date()

        if (existing[0]) {
            await existing[0].update(record => {
                record.lowSuccessNotificationState = JSON.stringify(state)
                record.updatedAt = now
            })
            return
        }

        await collection.create(record => {
            record.userId = userId
            record.notifyHabitStart =
                defaultNotificationPreferences.notifyHabitStart
            record.notifyDailyFocus =
                defaultNotificationPreferences.notifyDailyFocus
            record.notifyPriorityHabits =
                defaultNotificationPreferences.notifyPriorityHabits
            record.notifyLowSuccessHabits =
                defaultNotificationPreferences.notifyLowSuccessHabits
            record.lowSuccessNotificationState = JSON.stringify(state)
            record.createdAt = now
            record.updatedAt = now
        })
    })
}
