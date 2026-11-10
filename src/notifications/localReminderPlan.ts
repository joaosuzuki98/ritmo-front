import { getPriorityPresentation } from '../constants/priorities'
import type { PriorityCode } from '../constants/priorities'
import { localDateKey, normalizeLocalDate } from '../utils/normalizeLocalDate'
import type { NotificationPreferences } from './notificationPreferences'

export type ReminderHabit = {
    id: string
    name: string
    priority: string
    isFocusOfDay: boolean
    status: string
    preferredTime?: Date
    weekDays: readonly number[]
}

export type ReminderCompletion = {
    habitId: string
    date: Date
    status: string
    updatedAt?: Date
}

export type PlannedLocalReminder = {
    id: string
    title: string
    body: string
    scheduledAt: Date
}

const scheduleHorizonDays = 7
const maxScheduledNotifications = 50
const priorityRank: Record<PriorityCode, number> = {
    low: 1,
    medium: 2,
    high: 3,
}

const getWeekDay = (date: Date) => date.getDay() || 7

const getDateAfterDays = (date: Date, days: number) => {
    const result = normalizeLocalDate(date)
    result.setDate(result.getDate() + days)
    return result
}

const getCompletionStatusesByHabitAndDate = (
    completions: readonly ReminderCompletion[],
) => {
    const latest = new Map<string, ReminderCompletion>()

    completions.forEach(completion => {
        const key = `${completion.habitId}:${localDateKey(completion.date)}`
        const existing = latest.get(key)
        const completionUpdatedAt =
            completion.updatedAt?.getTime() ?? completion.date.getTime()
        const existingUpdatedAt = existing
            ? existing.updatedAt?.getTime() ?? existing.date.getTime()
            : -1

        if (!existing || completionUpdatedAt >= existingUpdatedAt)
            latest.set(key, completion)
    })

    return latest
}

const isIncompleteOnDate = (
    habit: ReminderHabit,
    date: Date,
    completions: Map<string, ReminderCompletion>,
) => {
    const completion = completions.get(`${habit.id}:${localDateKey(date)}`)
    return (completion?.status ?? habit.status) !== 'completed'
}

const getDailyCandidates = (habits: readonly ReminderHabit[], date: Date) =>
    habits.filter(
        habit =>
            habit.status !== 'paused' &&
            habit.weekDays.includes(getWeekDay(date)),
    )

const makeReminderTime = (
    date: Date,
    habits: readonly ReminderHabit[],
    fallbackHour: number,
    offsetHours: number,
) => {
    const times = habits
        .map(habit => habit.preferredTime)
        .filter((time): time is Date => time !== undefined)
        .map(time => time.getHours() * 60 + time.getMinutes())

    const result = new Date(date)
    if (times.length) {
        const latestTime = Math.max(...times)
        result.setHours(Math.floor(latestTime / 60), latestTime % 60, 0, 0)
        result.setHours(result.getHours() + offsetHours)
        return result
    }

    result.setHours(fallbackHour, 0, 0, 0)
    return result
}

const getNamesSummary = (habits: readonly ReminderHabit[]) => {
    const names = habits.slice(0, 3).map(habit => habit.name)
    const remaining = habits.length - names.length
    const summary = names.join(', ')
    return remaining > 0 ? `${summary}, and ${remaining} more` : summary
}

export const buildLocalReminderPlan = (
    habits: readonly ReminderHabit[],
    completions: readonly ReminderCompletion[],
    preferences: NotificationPreferences,
    now = new Date(),
): PlannedLocalReminder[] => {
    const completionByHabitAndDate =
        getCompletionStatusesByHabitAndDate(completions)
    const dailyReminders: PlannedLocalReminder[] = []
    const habitStartReminders: PlannedLocalReminder[] = []

    for (let daysAhead = 0; daysAhead < scheduleHorizonDays; daysAhead += 1) {
        const date = getDateAfterDays(now, daysAhead)
        const dayKey = localDateKey(date)
        const scheduledHabits = getDailyCandidates(habits, date)

        if (preferences.notifyHabitStart) {
            scheduledHabits.forEach(habit => {
                if (
                    !habit.preferredTime ||
                    !isIncompleteOnDate(habit, date, completionByHabitAndDate)
                )
                    return

                const scheduledAt = new Date(date)
                scheduledAt.setHours(
                    habit.preferredTime.getHours(),
                    habit.preferredTime.getMinutes(),
                    0,
                    0,
                )
                scheduledAt.setMinutes(scheduledAt.getMinutes() - 15)
                if (scheduledAt <= now) return

                habitStartReminders.push({
                    id: `ritmo:habit-start:${habit.id}:${dayKey}`,
                    title: 'Habit starting soon',
                    body: `${habit.name} starts in 15 minutes.`,
                    scheduledAt,
                })
            })
        }

        const focusHabits = scheduledHabits.filter(habit => habit.isFocusOfDay)
        const incompleteFocusHabits = focusHabits.filter(habit =>
            isIncompleteOnDate(habit, date, completionByHabitAndDate),
        )
        if (preferences.notifyDailyFocus && incompleteFocusHabits.length) {
            const scheduledAt = makeReminderTime(date, focusHabits, 18, 2)
            if (scheduledAt > now) {
                dailyReminders.push({
                    id: `ritmo:focus:${dayKey}`,
                    title: "Today's focus habits",
                    body: `Still to complete: ${getNamesSummary(
                        incompleteFocusHabits,
                    )}.`,
                    scheduledAt,
                })
            }
        }

        if (preferences.notifyPriorityHabits && preferences.minimumPriority) {
            const minimumRank = priorityRank[preferences.minimumPriority]
            const priorityHabits = scheduledHabits.filter(
                habit =>
                    getPriorityPresentation(habit.priority).rank >= minimumRank,
            )
            const incompletePriorityHabits = priorityHabits.filter(habit =>
                isIncompleteOnDate(habit, date, completionByHabitAndDate),
            )
            if (incompletePriorityHabits.length) {
                const scheduledAt = makeReminderTime(
                    date,
                    priorityHabits,
                    15,
                    2,
                )
                if (scheduledAt > now) {
                    dailyReminders.push({
                        id: `ritmo:priority:${dayKey}`,
                        title: 'Priority habits to complete',
                        body: `Still to complete: ${getNamesSummary(
                            incompletePriorityHabits,
                        )}.`,
                        scheduledAt,
                    })
                }
            }
        }
    }

    const dailyPlan = dailyReminders.sort(
        (left, right) =>
            left.scheduledAt.getTime() - right.scheduledAt.getTime(),
    )
    const availableHabitSlots = Math.max(
        0,
        maxScheduledNotifications - dailyPlan.length,
    )
    const upcomingPlan = habitStartReminders
        .sort(
            (left, right) =>
                left.scheduledAt.getTime() - right.scheduledAt.getTime(),
        )
        .slice(0, availableHabitSlots)

    return [...dailyPlan, ...upcomingPlan].sort(
        (left, right) =>
            left.scheduledAt.getTime() - right.scheduledAt.getTime(),
    )
}
