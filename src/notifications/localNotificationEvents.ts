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
            record.pendingHabitAnalysisId = habitId
            record.createdAt = now
            record.updatedAt = now
        })
    })
}

export const registerLocalNotificationBackgroundHandler = () => {
    notifee.onBackgroundEvent(async ({ type, detail }) => {
        if (type !== EventType.PRESS) return

        const data = detail.notification?.data
        if (
            data?.type !== 'low_success_habit' ||
            typeof data.habitId !== 'string' ||
            typeof data.userId !== 'string'
        )
            return

        await savePendingHabitAnalysis(data.userId, data.habitId)
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
