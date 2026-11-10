import { weekDays } from '../constants/weekDays'
import { localDateKey, normalizeLocalDate } from '../utils/normalizeLocalDate'

export const minimumLoadAnalysisHabits = 5
export const minimumLoadAnalysisOccurrences = 10
export const loadReductionThreshold = 0.35
export const loadIncreaseThreshold = 0.85

export type HabitLoadHabit = {
    id: string
    name: string
    status: string
    weekDays: readonly number[]
    estimatedDurationMinutes?: number
    createdAt?: Date
    seasonalStart?: Date
    seasonalEnd?: Date
}

export type HabitLoadCompletion = {
    habitId: string
    date: Date
    status: string
    updatedAt?: Date
}

export type HabitLoadEvent = {
    dateTime: Date
    endTime?: Date
}

export type WeeklyHabitRate = {
    start: Date
    rate: number
    completedScore: number
    occurrenceCount: number
    activeHabitCount: number
}

export type LeastCompletedHabit = {
    id: string
    name: string
    rate: number
    occurrenceCount: number
}

export type LighterHabitDay = {
    weekDay: number
    scheduledHabitCount: number
    estimatedMinutes: number
    eventCount: number
}

export type HabitLoadAnalysis =
    | {
          kind: 'insufficient'
          activeHabitCount: number
          occurrenceCount: number
          weeklyRates: WeeklyHabitRate[]
      }
    | {
          kind: 'balanced'
          weeklyRates: WeeklyHabitRate[]
      }
    | {
          kind: 'reduce'
          weeklyRates: WeeklyHabitRate[]
          completionRate: number
          leastCompletedHabits: LeastCompletedHabit[]
      }
    | {
          kind: 'increase'
          weeklyRates: WeeklyHabitRate[]
          completionRate: number
          lighterDays: LighterHabitDay[]
      }

type WeeklyHabitCompletion = {
    completedScore: number
    occurrenceCount: number
}

const getWeekDay = (date: Date) => date.getDay() || 7

const getMonday = (date: Date) => {
    const monday = normalizeLocalDate(date)
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
    return monday
}

const getOutcomeScore = (status?: string) => {
    if (status === 'completed') return 1
    if (status === 'partial') return 0.5
    return 0
}

const getLatestCompletions = (completions: readonly HabitLoadCompletion[]) => {
    const latest = new Map<string, HabitLoadCompletion>()
    completions.forEach(completion => {
        const key = `${completion.habitId}:${localDateKey(completion.date)}`
        const previous = latest.get(key)
        if (
            !previous ||
            (completion.updatedAt?.getTime() ?? completion.date.getTime()) >=
                (previous.updatedAt?.getTime() ?? previous.date.getTime())
        )
            latest.set(key, completion)
    })
    return latest
}

const isHabitScheduledOn = (habit: HabitLoadHabit, date: Date) => {
    const day = normalizeLocalDate(date)
    return (
        habit.status !== 'paused' &&
        habit.weekDays.includes(getWeekDay(day)) &&
        (!habit.createdAt || day >= normalizeLocalDate(habit.createdAt)) &&
        (!habit.seasonalStart ||
            day >= normalizeLocalDate(habit.seasonalStart)) &&
        (!habit.seasonalEnd || day <= normalizeLocalDate(habit.seasonalEnd))
    )
}

const getWeeklyRates = (
    habits: readonly HabitLoadHabit[],
    completions: readonly HabitLoadCompletion[],
    now: Date,
) => {
    const latest = getLatestCompletions(completions)
    const currentMonday = getMonday(now)
    const weeks: WeeklyHabitRate[] = []

    for (let weeksAgo = 4; weeksAgo >= 1; weeksAgo -= 1) {
        const start = new Date(currentMonday)
        start.setDate(start.getDate() - weeksAgo * 7)
        let completedScore = 0
        let occurrenceCount = 0
        const activeHabitIds = new Set<string>()

        for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
            const date = new Date(start)
            date.setDate(date.getDate() + dayOffset)
            habits.forEach(habit => {
                if (!isHabitScheduledOn(habit, date)) return
                activeHabitIds.add(habit.id)
                occurrenceCount += 1
                const completion = latest.get(
                    `${habit.id}:${localDateKey(date)}`,
                )
                completedScore += getOutcomeScore(completion?.status)
            })
        }

        weeks.push({
            start,
            rate: occurrenceCount ? completedScore / occurrenceCount : 0,
            completedScore,
            occurrenceCount,
            activeHabitCount: activeHabitIds.size,
        })
    }
    return weeks
}

const getQualifyingWeeks = (weeks: readonly WeeklyHabitRate[]) =>
    weeks.filter(
        week =>
            week.activeHabitCount >= minimumLoadAnalysisHabits &&
            week.occurrenceCount >= minimumLoadAnalysisOccurrences,
    )

const getLeastCompletedHabits = (
    habits: readonly HabitLoadHabit[],
    completions: readonly HabitLoadCompletion[],
    weeks: readonly WeeklyHabitRate[],
): LeastCompletedHabit[] => {
    const latest = getLatestCompletions(completions)
    const scores = new Map<string, WeeklyHabitCompletion>()

    weeks.forEach(week => {
        for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
            const date = new Date(week.start)
            date.setDate(date.getDate() + dayOffset)
            habits.forEach(habit => {
                if (!isHabitScheduledOn(habit, date)) return
                const current = scores.get(habit.id) ?? {
                    completedScore: 0,
                    occurrenceCount: 0,
                }
                current.occurrenceCount += 1
                current.completedScore += getOutcomeScore(
                    latest.get(`${habit.id}:${localDateKey(date)}`)?.status,
                )
                scores.set(habit.id, current)
            })
        }
    })

    return habits
        .flatMap(habit => {
            const score = scores.get(habit.id)
            if (!score?.occurrenceCount) return []
            return [
                {
                    id: habit.id,
                    name: habit.name,
                    rate: score.completedScore / score.occurrenceCount,
                    occurrenceCount: score.occurrenceCount,
                },
            ]
        })
        .sort(
            (left, right) =>
                left.rate - right.rate ||
                right.occurrenceCount - left.occurrenceCount,
        )
        .slice(0, 3)
}

const getLighterDays = (
    habits: readonly HabitLoadHabit[],
    events: readonly HabitLoadEvent[],
    now: Date,
): LighterHabitDay[] => {
    const today = normalizeLocalDate(now)
    const nextDateForWeekDay = (weekDay: number) => {
        const date = new Date(today)
        const daysUntil = (weekDay - getWeekDay(date) + 7) % 7
        date.setDate(date.getDate() + daysUntil)
        return date
    }

    return weekDays
        .map(weekDay => {
            const date = nextDateForWeekDay(weekDay)
            const scheduledHabits = habits.filter(habit =>
                isHabitScheduledOn(habit, date),
            )
            const dayEvents = events.filter(
                event => localDateKey(event.dateTime) === localDateKey(date),
            )
            const eventMinutes = dayEvents.reduce((total, event) => {
                if (!event.endTime) return total + 60
                const duration =
                    (event.endTime.getTime() - event.dateTime.getTime()) / 60000
                return total + Math.max(0, duration)
            }, 0)

            return {
                weekDay,
                scheduledHabitCount: scheduledHabits.length,
                estimatedMinutes:
                    scheduledHabits.reduce(
                        (total, habit) =>
                            total + (habit.estimatedDurationMinutes ?? 0),
                        0,
                    ) + eventMinutes,
                eventCount: dayEvents.length,
            }
        })
        .sort(
            (left, right) =>
                left.scheduledHabitCount - right.scheduledHabitCount ||
                left.estimatedMinutes - right.estimatedMinutes ||
                left.eventCount - right.eventCount,
        )
        .slice(0, 3)
}

export const analyzeWeeklyHabitLoad = (
    habits: readonly HabitLoadHabit[],
    completions: readonly HabitLoadCompletion[],
    events: readonly HabitLoadEvent[],
    now = new Date(),
): HabitLoadAnalysis => {
    const weeklyRates = getWeeklyRates(habits, completions, now)
    const qualifyingWeeks = getQualifyingWeeks(weeklyRates)
    const latestWeek = weeklyRates[weeklyRates.length - 1]

    if (
        latestWeek.activeHabitCount < minimumLoadAnalysisHabits ||
        latestWeek.occurrenceCount < minimumLoadAnalysisOccurrences
    )
        return {
            kind: 'insufficient',
            activeHabitCount: latestWeek.activeHabitCount,
            occurrenceCount: latestWeek.occurrenceCount,
            weeklyRates,
        }

    const latestTwoWeeks = weeklyRates.slice(-2)
    if (
        latestTwoWeeks.every(
            week =>
                week.activeHabitCount >= minimumLoadAnalysisHabits &&
                week.occurrenceCount >= minimumLoadAnalysisOccurrences &&
                week.rate < loadReductionThreshold,
        )
    ) {
        const consideredWeeks = latestTwoWeeks
        const occurrenceCount = consideredWeeks.reduce(
            (total, week) => total + week.occurrenceCount,
            0,
        )
        const completedScore = consideredWeeks.reduce(
            (total, week) => total + week.completedScore,
            0,
        )
        return {
            kind: 'reduce',
            weeklyRates,
            completionRate: occurrenceCount
                ? completedScore / occurrenceCount
                : 0,
            leastCompletedHabits: getLeastCompletedHabits(
                habits,
                completions,
                consideredWeeks,
            ),
        }
    }

    const highConsistencyWeeks = qualifyingWeeks.filter(
        week => week.rate >= loadIncreaseThreshold,
    )
    if (highConsistencyWeeks.length >= 3) {
        const occurrenceCount = qualifyingWeeks.reduce(
            (total, week) => total + week.occurrenceCount,
            0,
        )
        const completedScore = qualifyingWeeks.reduce(
            (total, week) => total + week.completedScore,
            0,
        )
        return {
            kind: 'increase',
            weeklyRates,
            completionRate: occurrenceCount
                ? completedScore / occurrenceCount
                : 0,
            lighterDays: getLighterDays(habits, events, now),
        }
    }

    return { kind: 'balanced', weeklyRates }
}
