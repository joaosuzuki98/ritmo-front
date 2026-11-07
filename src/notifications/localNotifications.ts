import notifee, {
    AndroidImportance,
    AndroidNotificationSetting,
    AuthorizationStatus,
    TriggerType,
} from '@notifee/react-native'
import { AppState, Platform } from 'react-native'
import { Q } from '@nozbe/watermelondb'

import {
    database,
    type CompletionRecord,
    type Habit,
    type NotificationPreference,
} from '../database'
import {
    defaultNotificationPreferences,
    type NotificationPreferences,
} from './notificationPreferences'
import { buildLocalReminderPlan } from './localReminderPlan'

const notificationChannelId = 'habit-reminders'
const notificationIdPrefix = 'ritmo:'

export type LocalNotificationAccess = {
    hasPermission: boolean
    needsExactAlarmPermission: boolean
}

const createHabitReminderChannel = () =>
    notifee.createChannel({
        id: notificationChannelId,
        name: 'Habit reminders',
        description: 'Local reminders for your scheduled habits',
        importance: AndroidImportance.DEFAULT,
    })

export const requestLocalNotificationPermission =
    async (): Promise<LocalNotificationAccess> => {
        await createHabitReminderChannel()
        await notifee.requestPermission()
        return getLocalNotificationPermission()
    }

export const getLocalNotificationPermission =
    async (): Promise<LocalNotificationAccess> => {
        const settings = await notifee.getNotificationSettings()
        const hasPermission =
            settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED
        return {
            hasPermission,
            needsExactAlarmPermission:
                hasPermission &&
                Platform.OS === 'android' &&
                settings.android.alarm === AndroidNotificationSetting.DISABLED,
        }
    }

export const openLocalNotificationSettings = (
    needsExactAlarmPermission: boolean,
) =>
    needsExactAlarmPermission && Platform.OS === 'android'
        ? notifee.openAlarmPermissionSettings()
        : notifee.openNotificationSettings()

const toPreferences = (
    record?: NotificationPreference,
): NotificationPreferences => {
    if (!record) return defaultNotificationPreferences

    const minimumPriority =
        record.minimumPriority === 'low' ||
        record.minimumPriority === 'medium' ||
        record.minimumPriority === 'high'
            ? record.minimumPriority
            : null

    return {
        notifyHabitStart: record.notifyHabitStart,
        notifyDailyFocus: record.notifyDailyFocus,
        notifyPriorityHabits: record.notifyPriorityHabits,
        minimumPriority,
    }
}

const cancelUserNotifications = async (userId: string) => {
    const prefix = `${notificationIdPrefix}${userId}:`
    const triggers = await notifee.getTriggerNotifications()
    await Promise.all(
        triggers.flatMap(({ notification }) =>
            notification.id?.startsWith(prefix)
                ? [notifee.cancelNotification(notification.id)]
                : [],
        ),
    )
}

const scheduleUserNotifications = async (
    userId: string,
    habits: readonly Habit[],
    completions: readonly CompletionRecord[],
    preferences: NotificationPreferences,
) => {
    await cancelUserNotifications(userId)

    const hasEnabledOption =
        preferences.notifyHabitStart ||
        preferences.notifyDailyFocus ||
        preferences.notifyPriorityHabits
    if (!hasEnabledOption) return

    const reminders = buildLocalReminderPlan(
        habits.map(habit => ({
            id: habit.id,
            name: habit.name,
            priority: habit.priority,
            isFocusOfDay: habit.isFocusOfDay,
            status: habit.status,
            preferredTime: habit.preferredTime,
            weekDays: habit.weekDays,
        })),
        completions.map(completion => ({
            habitId: completion.habitId,
            date: completion.date,
            status: completion.status,
            updatedAt: completion.updatedAt,
        })),
        preferences,
    )
    if (!reminders.length) return

    const access = await getLocalNotificationPermission()
    if (!access.hasPermission || access.needsExactAlarmPermission) return

    await createHabitReminderChannel()

    await Promise.all(
        reminders.map(reminder =>
            notifee.createTriggerNotification(
                {
                    id: `${notificationIdPrefix}${userId}:${reminder.id.replace(
                        'ritmo:',
                        '',
                    )}`,
                    title: reminder.title,
                    body: reminder.body,
                    android: {
                        channelId: notificationChannelId,
                        pressAction: { id: 'default' },
                    },
                },
                {
                    type: TriggerType.TIMESTAMP,
                    timestamp: reminder.scheduledAt.getTime(),
                    alarmManager: { allowWhileIdle: true },
                },
            ),
        ),
    )
}

export const startLocalReminderManager = (userId: string) => {
    let habits: Habit[] = []
    let completions: CompletionRecord[] = []
    let preferences = defaultNotificationPreferences
    let isStopped = false
    let scheduleQueue = Promise.resolve()
    let completionSubscription: { unsubscribe: () => void } | undefined

    const schedule = () => {
        scheduleQueue = scheduleQueue
            .catch(() => undefined)
            .then(async () => {
                if (isStopped) return
                await scheduleUserNotifications(
                    userId,
                    habits,
                    completions,
                    preferences,
                )
            })
    }

    const habitsSubscription = database
        .get<Habit>('habits')
        .query(Q.where('user_id', userId))
        .observeWithColumns([
            'name',
            'priority',
            'is_focus_of_day',
            'status',
            'preferred_time',
            'week_days',
        ])
        .subscribe(records => {
            habits = records
            completionSubscription?.unsubscribe()
            completionSubscription = undefined

            if (habits.length) {
                completionSubscription = database
                    .get<CompletionRecord>('completion_records')
                    .query(
                        Q.where(
                            'habit_id',
                            Q.oneOf(habits.map(habit => habit.id)),
                        ),
                    )
                    .observeWithColumns(['date', 'status', 'updated_at'])
                    .subscribe(completionRecords => {
                        completions = completionRecords
                        schedule()
                    })
            } else {
                completions = []
            }

            schedule()
        })

    const preferencesSubscription = database
        .get<NotificationPreference>('notification_preferences')
        .query(Q.where('user_id', userId))
        .observeWithColumns([
            'notify_habit_start',
            'notify_daily_focus',
            'notify_priority_habits',
            'minimum_priority',
        ])
        .subscribe(records => {
            preferences = toPreferences(records[0])
            schedule()
        })

    const appStateSubscription = AppState.addEventListener(
        'change',
        appState => {
            if (appState === 'active') schedule()
        },
    )

    return () => {
        isStopped = true
        habitsSubscription.unsubscribe()
        preferencesSubscription.unsubscribe()
        completionSubscription?.unsubscribe()
        appStateSubscription.remove()
        scheduleQueue
            .catch(() => undefined)
            .then(() => cancelUserNotifications(userId))
            .catch(() => undefined)
    }
}
