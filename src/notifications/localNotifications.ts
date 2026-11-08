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
    type Event,
    type Habit,
    type NotificationPreference,
} from '../database'
import {
    defaultNotificationPreferences,
    parseLowSuccessNotificationState,
    saveLowSuccessNotificationState,
    type NotificationPreferences,
    type LowSuccessNotificationState,
} from './notificationPreferences'
import { buildLocalReminderPlan } from './localReminderPlan'
import { evaluateLowSuccessNotifications } from './lowSuccessNotifications'
import { buildWeeklyHabitLoadNotificationPlan } from './weeklyHabitLoadNotification'

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
        notifyLowSuccessHabits: record.notifyLowSuccessHabits ?? false,
        notifyWeeklyHabitLoad: record.notifyWeeklyHabitLoad ?? false,
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
    events: readonly Event[],
    preferences: NotificationPreferences,
    notificationState: LowSuccessNotificationState,
    onNotificationStateChange: (
        state: LowSuccessNotificationState,
    ) => Promise<void>,
) => {
    await cancelUserNotifications(userId)

    const hasEnabledOption =
        preferences.notifyHabitStart ||
        preferences.notifyDailyFocus ||
        preferences.notifyPriorityHabits

    if (hasEnabledOption) {
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

        if (reminders.length) {
            const access = await getLocalNotificationPermission()
            if (access.hasPermission && !access.needsExactAlarmPermission) {
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
                                    smallIcon: 'ic_notification',
                                    largeIcon: require('../assets/images/mascot/default-mascot.png'),
                                    circularLargeIcon: true,
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
        }
    }

    const weeklyLoadPlan = buildWeeklyHabitLoadNotificationPlan(
        habits.map(habit => ({
            id: habit.id,
            name: habit.name,
            status: habit.status,
            weekDays: habit.weekDays,
            estimatedDurationMinutes: habit.estimatedDurationMinutes,
            createdAt: habit.createdAt,
            seasonalStart: habit.seasonalStart,
            seasonalEnd: habit.seasonalEnd,
        })),
        completions.map(completion => ({
            habitId: completion.habitId,
            date: completion.date,
            status: completion.status,
            updatedAt: completion.updatedAt,
        })),
        events.map(event => ({
            dateTime: event.dateTime,
            endTime: event.endTime,
        })),
        preferences.notifyWeeklyHabitLoad,
    )

    if (weeklyLoadPlan) {
        const access = await getLocalNotificationPermission()
        if (access.hasPermission && !access.needsExactAlarmPermission) {
            await createHabitReminderChannel()
            await notifee.createTriggerNotification(
                {
                    id: `${notificationIdPrefix}${userId}:weekly-habit-load`,
                    title: weeklyLoadPlan.title,
                    body: weeklyLoadPlan.body,
                    data: {
                        type: 'weekly_habit_load',
                        userId,
                    },
                    android: {
                        channelId: notificationChannelId,
                        smallIcon: 'ic_notification',
                        largeIcon: require('../assets/images/mascot/default-mascot.png'),
                        circularLargeIcon: true,
                        pressAction: { id: 'default' },
                    },
                },
                {
                    type: TriggerType.TIMESTAMP,
                    timestamp: weeklyLoadPlan.scheduledAt.getTime(),
                    alarmManager: { allowWhileIdle: true },
                },
            )
        }
    }

    const lowSuccessEvaluation = evaluateLowSuccessNotifications(
        habits.map(habit => ({
            id: habit.id,
            name: habit.name,
            status: habit.status,
            weekDays: habit.weekDays,
            preferredTime: habit.preferredTime,
            estimatedDurationMinutes: habit.estimatedDurationMinutes,
            createdAt: habit.createdAt,
            seasonalStart: habit.seasonalStart,
            seasonalEnd: habit.seasonalEnd,
        })),
        completions.map(completion => ({
            habitId: completion.habitId,
            date: completion.date,
            status: completion.status,
            completionTime: completion.completionTime,
            updatedAt: completion.updatedAt,
        })),
        notificationState,
        {
            enabled: preferences.notifyLowSuccessHabits,
            hasPermission: (await getLocalNotificationPermission())
                .hasPermission,
        },
    )

    if (lowSuccessEvaluation.notifications.length) {
        await createHabitReminderChannel()
        await Promise.all(
            lowSuccessEvaluation.notifications.map(notification =>
                notifee.displayNotification({
                    id: `${notificationIdPrefix}${userId}:low-success:${notification.habitId}:${notification.notifiedAt}`,
                    title: 'A habit could use a new schedule',
                    body: `${notification.habitName} has a ${Math.round(
                        notification.successRate * 100,
                    )}% success rate. Ask the Stars for a suggestion.`,
                    data: {
                        type: 'low_success_habit',
                        habitId: notification.habitId,
                        userId,
                    },
                    android: {
                        channelId: notificationChannelId,
                        smallIcon: 'ic_notification',
                        largeIcon: require('../assets/images/mascot/default-mascot.png'),
                        circularLargeIcon: true,
                        pressAction: { id: 'default' },
                    },
                }),
            ),
        )
    }

    if (
        JSON.stringify(lowSuccessEvaluation.state) !==
        JSON.stringify(notificationState)
    )
        await onNotificationStateChange(lowSuccessEvaluation.state)
}

export const startLocalReminderManager = (userId: string) => {
    let habits: Habit[] = []
    let completions: CompletionRecord[] = []
    let events: Event[] = []
    let preferences = defaultNotificationPreferences
    let notificationState: LowSuccessNotificationState = {}
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
                    events,
                    preferences,
                    notificationState,
                    async state => {
                        notificationState = state
                        await saveLowSuccessNotificationState(userId, state)
                    },
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
            'estimated_duration_minutes',
            'created_at',
            'seasonal_start',
            'seasonal_end',
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
                    .observeWithColumns([
                        'date',
                        'status',
                        'completion_time',
                        'updated_at',
                    ])
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
            'notify_low_success_habits',
            'notify_weekly_habit_load',
            'minimum_priority',
        ])
        .subscribe(records => {
            preferences = toPreferences(records[0])
            notificationState = parseLowSuccessNotificationState(
                records[0]?.lowSuccessNotificationState,
            )
            schedule()
        })

    const eventsSubscription = database
        .get<Event>('events')
        .query(Q.where('user_id', userId))
        .observeWithColumns(['date_time', 'end_time'])
        .subscribe(records => {
            events = records
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
        eventsSubscription.unsubscribe()
        completionSubscription?.unsubscribe()
        appStateSubscription.remove()
        scheduleQueue
            .catch(() => undefined)
            .then(() => cancelUserNotifications(userId))
            .catch(() => undefined)
    }
}
