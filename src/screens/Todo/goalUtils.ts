import type {
    CompletionRecord,
    GroupConsistencyGoal,
    Goal,
} from '../../database'
import {
    localDateKey,
    normalizeLocalDate,
} from '../../utils/normalizeLocalDate'
import type { TodoGoalHabitOption } from './todoGoals.types'

export const goalTerms = ['short', 'medium', 'long'] as const
export type GoalTerm = (typeof goalTerms)[number]

export type GoalTermOption = {
    value: GoalTerm
    deadlineType: string
    label: string
    durationDays: number
}

export const goalTermOptions: readonly GoalTermOption[] = [
    {
        value: 'short',
        deadlineType: 'short_term',
        label: 'Short term · 30 days',
        durationDays: 30,
    },
    {
        value: 'medium',
        deadlineType: 'medium_term',
        label: 'Medium term · 90 days',
        durationDays: 90,
    },
    {
        value: 'long',
        deadlineType: 'long_term',
        label: 'Long term · 365 days',
        durationDays: 365,
    },
]

export type GoalCompletionSource = Pick<
    CompletionRecord,
    'habitId' | 'date' | 'status' | 'updatedAt'
>

export type HabitScheduleSource = Pick<
    TodoGoalHabitOption,
    'id' | 'weekDays' | 'frequencyType'
>

const getLatestCompletionByHabitAndDate = (
    completions: readonly GoalCompletionSource[],
) => {
    const latest = new Map<string, GoalCompletionSource>()
    completions.forEach(completion => {
        const key = `${completion.habitId}:${localDateKey(completion.date)}`
        const current = latest.get(key)
        if (
            !current ||
            (completion.updatedAt?.getTime() ?? 0) >=
                (current.updatedAt?.getTime() ?? 0)
        )
            latest.set(key, completion)
    })
    return latest
}

export const getGoalTermOption = (value: GoalTerm): GoalTermOption =>
    goalTermOptions.find(option => option.value === value) ?? goalTermOptions[0]

export const getGoalTermFromDeadlineType = (
    deadlineType: string,
): GoalTermOption =>
    goalTermOptions.find(option => option.deadlineType === deadlineType) ??
    goalTermOptions[0]

export const getGoalEndDate = (startDate: Date, term: GoalTerm): Date => {
    const endDate = normalizeLocalDate(startDate)
    endDate.setDate(
        endDate.getDate() + getGoalTermOption(term).durationDays - 1,
    )
    return endDate
}

export const getGroupGoalTermOption = (
    goal: Pick<GroupConsistencyGoal, 'periodStart' | 'periodEnd'>,
): GoalTermOption => {
    const actualDays =
        Math.round(
            (normalizeLocalDate(goal.periodEnd).getTime() -
                normalizeLocalDate(goal.periodStart).getTime()) /
                (24 * 60 * 60 * 1000),
        ) + 1
    return goalTermOptions.reduce((closest, option) =>
        Math.abs(option.durationDays - actualDays) <
        Math.abs(closest.durationDays - actualDays)
            ? option
            : closest,
    )
}

export const countCompletedHabitOccurrences = (
    goal: Pick<Goal, 'habitId' | 'createdAt'>,
    completions: readonly GoalCompletionSource[],
    today = new Date(),
): number => {
    const startDate = normalizeLocalDate(goal.createdAt ?? today)
    const endDate = normalizeLocalDate(today)
    if (startDate > endDate) return 0
    const latest = getLatestCompletionByHabitAndDate(completions)
    return [...latest.values()].filter(
        completion =>
            completion.habitId === goal.habitId &&
            completion.status === 'completed' &&
            normalizeLocalDate(completion.date) >= startDate &&
            normalizeLocalDate(completion.date) <= endDate,
    ).length
}

export type GroupGoalProgress = {
    expectedOccurrences: number
    completedOccurrences: number
    actualPercentage: number
}

export const calculateGroupGoalProgress = (
    goal: Pick<
        GroupConsistencyGoal,
        'includedHabitIds' | 'periodStart' | 'periodEnd'
    >,
    habits: readonly HabitScheduleSource[],
    completions: readonly GoalCompletionSource[],
    today = new Date(),
): GroupGoalProgress => {
    const startDate = normalizeLocalDate(goal.periodStart)
    const endDate = normalizeLocalDate(goal.periodEnd)
    const lastElapsedDay = normalizeLocalDate(today)
    if (startDate > endDate || startDate > lastElapsedDay)
        return {
            expectedOccurrences: 0,
            completedOccurrences: 0,
            actualPercentage: 0,
        }

    const scheduledHabits = habits.filter(habit =>
        goal.includedHabitIds.includes(habit.id),
    )
    const latest = getLatestCompletionByHabitAndDate(completions)
    const finalDate = endDate < lastElapsedDay ? endDate : lastElapsedDay
    let expectedOccurrences = 0
    let completedOccurrences = 0

    for (
        const date = new Date(startDate);
        date <= finalDate;
        date.setDate(date.getDate() + 1)
    ) {
        const weekDay = date.getDay() || 7
        scheduledHabits.forEach(habit => {
            const isScheduled =
                habit.frequencyType === 'daily' ||
                habit.weekDays.includes(weekDay)
            if (!isScheduled) return

            expectedOccurrences += 1
            const completion = latest.get(`${habit.id}:${localDateKey(date)}`)
            if (completion?.status === 'completed') completedOccurrences += 1
        })
    }

    return {
        expectedOccurrences,
        completedOccurrences,
        actualPercentage: expectedOccurrences
            ? Math.round((completedOccurrences / expectedOccurrences) * 100)
            : 0,
    }
}

export const getGoalStatus = (
    currentValue: number,
    targetValue: number,
    dueDate: Date,
    today = new Date(),
): string => {
    if (currentValue >= targetValue) return 'completed'
    return normalizeLocalDate(today) > normalizeLocalDate(dueDate)
        ? 'overdue'
        : 'in_progress'
}

export const getGroupGoalStatus = (
    actualPercentage: number,
    targetPercentage: number,
    periodEnd: Date,
    today = new Date(),
): string => {
    if (actualPercentage >= targetPercentage) return 'completed'
    return normalizeLocalDate(today) > normalizeLocalDate(periodEnd)
        ? 'overdue'
        : 'in_progress'
}

export const getGoalProgressPercent = (
    currentValue: number,
    targetValue: number,
): number =>
    targetValue > 0
        ? Math.min(100, Math.round((currentValue / targetValue) * 100))
        : 0
