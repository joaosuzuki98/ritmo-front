import notifee, { EventType } from '@notifee/react-native'
import { Q } from '@nozbe/watermelondb'

import { database, type NotificationPreference } from '../database'
import { defaultNotificationPreferences } from './notificationPreferences'

const savePendingHabitAnalysis = async (userId: string, habitId: string) => {
    const collection = database.get<NotificationPreference>(
        'notification_preferences',
    )

    await database.write(async () => {
        const records = await collection
            .query(Q.where('user_id', userId))
            .fetch()
        const now = new Date()

        if (records[0]) {
            await records[0].update(record => {
                record.pendingHabitAnalysisId = habitId
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
            record.notifyWeeklyHabitLoad =
                defaultNotificationPreferences.notifyWeeklyHabitLoad
            record.pendingHabitAnalysisId = habitId
            record.createdAt = now
            record.updatedAt = now
        })
    })
}

const savePendingWeeklyLoadAnalysis = async (userId: string) => {
    const collection = database.get<NotificationPreference>(
        'notification_preferences',
    )

    await database.write(async () => {
        const records = await collection
            .query(Q.where('user_id', userId))
            .fetch()
        const now = new Date()

        if (records[0]) {
            await records[0].update(record => {
                record.pendingWeeklyHabitLoad = true
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
            record.notifyWeeklyHabitLoad =
                defaultNotificationPreferences.notifyWeeklyHabitLoad
            record.pendingWeeklyHabitLoad = true
            record.createdAt = now
            record.updatedAt = now
        })
    })
}

export const registerLocalNotificationBackgroundHandler = () => {
    notifee.onBackgroundEvent(async ({ type, detail }) => {
        if (type !== EventType.PRESS) return

        const data = detail.notification?.data
        if (!data || typeof data.userId !== 'string') return

        if (data.type === 'low_success_habit') {
            if (typeof data.habitId === 'string')
                await savePendingHabitAnalysis(data.userId, data.habitId)
            return
        }
        if (data.type === 'weekly_habit_load')
            await savePendingWeeklyLoadAnalysis(data.userId)
    })
}

export const consumePendingHabitAnalysis = async (
    userId: string,
): Promise<string | null> => {
    const collection = database.get<NotificationPreference>(
        'notification_preferences',
    )
    let pendingHabitId: string | null = null

    await database.write(async () => {
        const records = await collection
            .query(Q.where('user_id', userId))
            .fetch()
        const record = records[0]
        if (!record?.pendingHabitAnalysisId) return

        pendingHabitId = record.pendingHabitAnalysisId
        await record.update(updatedRecord => {
            updatedRecord.pendingHabitAnalysisId = undefined
            updatedRecord.updatedAt = new Date()
        })
    })

    return pendingHabitId
}

export const consumePendingWeeklyLoadAnalysis = async (
    userId: string,
): Promise<boolean> => {
    const collection = database.get<NotificationPreference>(
        'notification_preferences',
    )
    let isPending = false

    await database.write(async () => {
        const records = await collection
            .query(Q.where('user_id', userId))
            .fetch()
        const record = records[0]
        if (!record?.pendingWeeklyHabitLoad) return

        isPending = true
        await record.update(updatedRecord => {
            updatedRecord.pendingWeeklyHabitLoad = false
            updatedRecord.updatedAt = new Date()
        })
    })

    return isPending
}
