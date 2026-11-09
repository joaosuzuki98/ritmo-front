import type {
    Category,
    CompletionRecord,
    Goal,
    Habit,
    IncompletionReason,
} from '../../database'
import {
    localDateKey,
    normalizeLocalDate,
} from '../../utils/normalizeLocalDate'
import { calculateHabitStreak } from '../HabitsDashboard/streakUtils'
import { countCompletedHabitOccurrences } from '../Todo/goalUtils'
import type { AiChatStatistics } from '../../services/endpoints/ai'

type StatisticsInput = {
    habits: readonly Habit[]
    completions: readonly CompletionRecord[]
    categories: readonly Category[]
    goals: readonly Goal[]
    reasons: readonly IncompletionReason[]
    now?: Date
}

const getCompletionRate = (completed: number, planned: number) =>
    planned ? completed / planned : null

const getWeekStart = (date: Date) => {
    const start = normalizeLocalDate(date)
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
    return start
}

const isScheduled = (habit: Habit, date: Date) =>
    habit.frequencyType === 'daily' ||
    habit.weekDays.includes(date.getDay() || 7)

const getLatestRecords = (records: readonly CompletionRecord[]) => {
    const latest = new Map<string, CompletionRecord>()
    records.forEach(record => {
        const key = `${record.habitId}:${localDateKey(record.date)}`
        const previous = latest.get(key)
        if (
            !previous ||
            (record.updatedAt?.getTime() ?? 0) >=
                (previous.updatedAt?.getTime() ?? 0)
        )
            latest.set(key, record)
    })
    return latest
}

export const buildAiChatStatistics = ({
    habits,
    completions,
    categories,
    goals,
    reasons,
    now = new Date(),
}: StatisticsInput): AiChatStatistics => {
    const activeHabits = habits.filter(
        habit => habit.status !== 'paused' && habit.status !== 'deleted',
    )
    const activeHabitIds = new Set(activeHabits.map(habit => habit.id))
    const latest = getLatestRecords(
        completions.filter(record => activeHabitIds.has(record.habitId)),
    )
    const weekStart = getWeekStart(now)
    const periodRows = Array.from({ length: 4 }, (_, index) => {
        const start = new Date(weekStart)
        start.setDate(start.getDate() - (3 - index) * 7)
        const end = new Date(start)
        end.setDate(end.getDate() + 6)
        const upto =
            normalizeLocalDate(now) < end ? normalizeLocalDate(now) : end
        let planned = 0
        let completed = 0
        for (
            const date = new Date(start);
            date <= upto;
            date.setDate(date.getDate() + 1)
        ) {
            activeHabits.forEach(habit => {
                if (
                    habit.createdAt &&
                    normalizeLocalDate(habit.createdAt) > date
                )
                    return
                if (!isScheduled(habit, date)) return
                planned += 1
                if (
                    latest.get(`${habit.id}:${localDateKey(date)}`)?.status ===
                    'completed'
                )
                    completed += 1
            })
        }
        return {
            label: `week-${index + 1}`,
            planned,
            completed,
            completionRate: getCompletionRate(completed, planned),
        }
    })

    const habitStats = activeHabits.map(habit => {
        const relevant = [...latest.values()].filter(
            record => record.habitId === habit.id,
        )
        let planned = 0
        const firstDay = new Date(weekStart)
        firstDay.setDate(firstDay.getDate() - 21)
        for (
            const date = new Date(firstDay);
            date <= normalizeLocalDate(now);
            date.setDate(date.getDate() + 1)
        ) {
            if (
                (!habit.createdAt ||
                    normalizeLocalDate(habit.createdAt) <= date) &&
                isScheduled(habit, date)
            )
                planned += 1
        }
        const streak = calculateHabitStreak(relevant, habit.weekDays, now)
        const currentStreak = streak.currentStreak
        return {
            habitId: habit.id,
            name: habit.name,
            planned,
            completed: relevant.filter(
                record =>
                    record.status === 'completed' &&
                    normalizeLocalDate(record.date) >= firstDay,
            ).length,
            completionRate: getCompletionRate(
                relevant.filter(
                    record =>
                        record.status === 'completed' &&
                        normalizeLocalDate(record.date) >= firstDay,
                ).length,
                planned,
            ),
            currentStreak,
            longestStreak: streak.longestStreak,
            nextStreakMilestone: (Math.floor(currentStreak / 7) + 1) * 7,
            periods: periodRows.map((period, index) => {
                const start = new Date(weekStart)
                start.setDate(start.getDate() - (3 - index) * 7)
                const end = new Date(start)
                end.setDate(end.getDate() + 6)
                let count = 0
                for (
                    const date = new Date(start);
                    date <= end && date <= normalizeLocalDate(now);
                    date.setDate(date.getDate() + 1)
                )
                    if (
                        (!habit.createdAt ||
                            normalizeLocalDate(habit.createdAt) <= date) &&
                        isScheduled(habit, date)
                    )
                        count += 1
                const done = relevant.filter(
                    record =>
                        record.status === 'completed' &&
                        normalizeLocalDate(record.date) >= start &&
                        normalizeLocalDate(record.date) <= end,
                ).length
                return {
                    label: period.label,
                    planned: count,
                    completed: done,
                    completionRate: getCompletionRate(done, count),
                }
            }),
        }
    })

    const sampleDates = Array.from({ length: 28 }, (_, index) => {
        const date = new Date(normalizeLocalDate(now))
        date.setDate(date.getDate() - 27 + index)
        return date
    })
    const weekdays = Array.from({ length: 7 }, (_, index) => {
        const weekDay = index + 1
        let planned = 0
        let completed = 0
        for (const date of sampleDates) {
            if ((date.getDay() || 7) !== weekDay) continue
            activeHabits.forEach(habit => {
                if (
                    habit.createdAt &&
                    normalizeLocalDate(habit.createdAt) > date
                )
                    return
                if (!isScheduled(habit, date)) return
                planned += 1
                if (
                    latest.get(`${habit.id}:${localDateKey(date)}`)?.status ===
                    'completed'
                )
                    completed += 1
            })
        }
        return {
            weekDay,
            planned,
            completed,
            completionRate: getCompletionRate(completed, planned),
        }
    })
    const timeSlots = [
        ['early_morning', 0, 5],
        ['morning', 5, 12],
        ['afternoon', 12, 17],
        ['evening', 17, 21],
        ['night', 21, 24],
    ] as const
    const timeOfDay = timeSlots.map(([label, from, to]) => {
        let planned = 0
        let completed = 0
        for (const date of sampleDates) {
            activeHabits.forEach(habit => {
                const preferredHour = habit.preferredTime?.getHours()
                if (
                    preferredHour === undefined ||
                    preferredHour < from ||
                    preferredHour >= to ||
                    (habit.createdAt &&
                        normalizeLocalDate(habit.createdAt) > date) ||
                    !isScheduled(habit, date)
                )
                    return
                planned += 1
                if (
                    latest.get(`${habit.id}:${localDateKey(date)}`)?.status ===
                    'completed'
                )
                    completed += 1
            })
        }
        return {
            label,
            planned,
            completed,
            completionRate: getCompletionRate(completed, planned),
        }
    })
    const reasonsById = new Map(
        reasons.map(reason => [reason.id, reason.description]),
    )
    const incompletionCounts = new Map<string, number>()
    latest.forEach(record => {
        if (record.status === 'completed') return
        const reason = record.incompletionReasonId
            ? reasonsById.get(record.incompletionReasonId)
            : undefined
        if (reason)
            incompletionCounts.set(
                reason,
                (incompletionCounts.get(reason) ?? 0) + 1,
            )
    })
    const categoriesStats = categories.map(category => {
        const members = activeHabits.filter(
            habit => habit.categoryId === category.id,
        )
        let planned = 0
        let completed = 0
        for (const date of sampleDates) {
            members.forEach(habit => {
                if (
                    habit.createdAt &&
                    normalizeLocalDate(habit.createdAt) > date
                )
                    return
                if (!isScheduled(habit, date)) return
                planned += 1
                if (
                    latest.get(`${habit.id}:${localDateKey(date)}`)?.status ===
                    'completed'
                )
                    completed += 1
            })
        }
        return {
            name: category.name,
            habitCount: members.length,
            completionRate: getCompletionRate(completed, planned),
        }
    })
    const goalsStats = goals
        .filter(goal => activeHabits.some(habit => habit.id === goal.habitId))
        .map(goal => {
            const currentValue = countCompletedHabitOccurrences(
                goal,
                completions,
                now,
            )
            const remainingValue = Math.max(0, goal.targetValue - currentValue)
            const createdAt = normalizeLocalDate(goal.createdAt ?? now)
            const recentWindowStart = new Date(normalizeLocalDate(now))
            recentWindowStart.setDate(recentWindowStart.getDate() - 27)
            const paceStart =
                createdAt > recentWindowStart ? createdAt : recentWindowStart
            const elapsedWeeks = Math.max(
                1,
                (normalizeLocalDate(now).getTime() -
                    paceStart.getTime() +
                    86400000) /
                    (7 * 86400000),
            )
            const recentCount = [...latest.values()].filter(
                record =>
                    record.habitId === goal.habitId &&
                    record.status === 'completed' &&
                    normalizeLocalDate(record.date) >= paceStart &&
                    normalizeLocalDate(record.date) <= normalizeLocalDate(now),
            ).length
            const recentPacePerWeek = recentCount / elapsedWeeks
            const projected =
                recentPacePerWeek > 0
                    ? new Date(
                          now.getTime() +
                              (remainingValue / recentPacePerWeek) *
                                  7 *
                                  86400000,
                      )
                    : null
            return {
                goalId: goal.id,
                habitId: goal.habitId,
                description: goal.description,
                targetValue: goal.targetValue,
                currentValue,
                remainingValue,
                recentPacePerWeek: recentCount ? recentPacePerWeek : null,
                projectedCompletionDate: projected
                    ? localDateKey(projected)
                    : null,
                deadlineType: goal.deadlineType,
                status: goal.status,
            }
        })
    const weeklyLoadPlanned = periodRows[3].planned
    const weeklyCompleted = periodRows[3].completed
    const weeklyMinutes = activeHabits.reduce((total, habit) => {
        let plannedForHabit = 0
        const currentWeekStart = new Date(weekStart)
        for (
            const date = new Date(currentWeekStart);
            date <= normalizeLocalDate(now);
            date.setDate(date.getDate() + 1)
        ) {
            if (
                (!habit.createdAt ||
                    normalizeLocalDate(habit.createdAt) <= date) &&
                isScheduled(habit, date)
            )
                plannedForHabit += 1
        }
        return total + (habit.estimatedDurationMinutes ?? 0) * plannedForHabit
    }, 0)
    const correlations: NonNullable<AiChatStatistics['correlations']> = []
    for (let left = 0; left < activeHabits.length; left += 1) {
        for (let right = left + 1; right < activeHabits.length; right += 1) {
            const habitA = activeHabits[left]
            const habitB = activeHabits[right]
            const sample = sampleDates.filter(
                date =>
                    isScheduled(habitA, date) &&
                    isScheduled(habitB, date) &&
                    latest.has(`${habitA.id}:${localDateKey(date)}`) &&
                    latest.has(`${habitB.id}:${localDateKey(date)}`),
            )
            if (sample.length < 7) continue
            const values = sample.map(date => [
                Number(
                    latest.get(`${habitA.id}:${localDateKey(date)}`)?.status ===
                        'completed',
                ),
                Number(
                    latest.get(`${habitB.id}:${localDateKey(date)}`)?.status ===
                        'completed',
                ),
            ])
            const meanA =
                values.reduce((sum, pair) => sum + pair[0], 0) / values.length
            const meanB =
                values.reduce((sum, pair) => sum + pair[1], 0) / values.length
            const covariance = values.reduce(
                (sum, pair) => sum + (pair[0] - meanA) * (pair[1] - meanB),
                0,
            )
            const varianceA = values.reduce(
                (sum, pair) => sum + (pair[0] - meanA) ** 2,
                0,
            )
            const varianceB = values.reduce(
                (sum, pair) => sum + (pair[1] - meanB) ** 2,
                0,
            )
            const denominator = Math.sqrt(varianceA * varianceB)
            if (!denominator) continue
            correlations.push({
                habitA: habitA.name,
                habitB: habitB.name,
                coefficient: Math.max(
                    -1,
                    Math.min(1, covariance / denominator),
                ),
                sampleSize: sample.length,
            })
        }
    }

    return {
        periods: periodRows,
        habits: habitStats,
        weekdays,
        timeOfDay,
        incompletionReasons: [...incompletionCounts].map(([reason, count]) => ({
            reason,
            count,
        })),
        categories: categoriesStats,
        weeklyLoad: {
            plannedSessions: weeklyLoadPlanned,
            estimatedMinutes: weeklyMinutes,
            completionRate: getCompletionRate(
                weeklyCompleted,
                weeklyLoadPlanned,
            ),
        },
        goals: goalsStats,
        correlations,
    }
}
