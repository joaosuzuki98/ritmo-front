import { Q } from '@nozbe/watermelondb'

import { database, type NotificationPreference } from '../database'
import type { PriorityCode } from '../constants/priorities'

export type NotificationPreferences = {
    notifyHabitStart: boolean
    notifyDailyFocus: boolean
    notifyPriorityHabits: boolean
    minimumPriority: PriorityCode | null
}

export const defaultNotificationPreferences: NotificationPreferences = {
    notifyHabitStart: false,
    notifyDailyFocus: false,
    notifyPriorityHabits: false,
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
            record.minimumPriority =
                changes.minimumPriority ??
                defaultNotificationPreferences.minimumPriority ??
                undefined
            record.createdAt = now
            record.updatedAt = now
        })
    })
}
