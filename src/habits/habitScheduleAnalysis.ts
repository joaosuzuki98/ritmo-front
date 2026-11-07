import { weekDays } from '../constants/weekDays'
import { localDateKey, normalizeLocalDate } from '../utils/normalizeLocalDate'

export const lowSuccessThreshold = 0.15
export const productiveSuccessThreshold = 0.75
export const minimumAnalysisOccurrences = 8
export const minimumTimeSlotOccurrences = 3
export const analysisHistoryDays = 90

export type ScheduleAnalysisHabit = {
    id: string
    name: string
    status: string
    weekDays: readonly number[]
    preferredTime?: Date
    estimatedDurationMinutes?: number
    createdAt?: Date
    seasonalStart?: Date
    seasonalEnd?: Date
}

export type ScheduleAnalysisCompletion = {
    habitId: string
    date: Date
    status: string
    completionTime?: Date
    updatedAt?: Date
}

export type ScheduleAnalysisEvent = {
    id: string
    title: string
    dateTime: Date
    endTime?: Date
}

export type HabitScheduleSuggestion = {
    days: number[]
    time: Date
    successRate: number
    sampleCount: number
}

export type HabitScheduleAnalysis = {
    habitId: string
    occurrenceCount: number
    successRate: number
    hasEnoughHistory: boolean
    isLowSuccess: boolean
    suggestions: HabitScheduleSuggestion[]
}

type HabitOccurrence = {
    date: Date
    status: string
    completionTime?: Date
    preferredTime?: Date
}

type TimeBucket = {
    score: number
    count: number
}

const getWeekDay = (date: Date) => date.getDay() || 7

const getCompletionKey = (habitId: string, date: Date) =>
    `${habitId}:${localDateKey(date)}`

const getLatestCompletionByHabitAndDate = (
    completions: readonly ScheduleAnalysisCompletion[],
) => {
    const latest = new Map<string, ScheduleAnalysisCompletion>()

    completions.forEach(completion => {
        const key = getCompletionKey(completion.habitId, completion.date)
        const existing = latest.get(key)
        const timestamp =
            completion.updatedAt?.getTime() ?? completion.date.getTime()
        const existingTimestamp = existing
            ? existing.updatedAt?.getTime() ?? existing.date.getTime()
            : -1

        if (!existing || timestamp >= existingTimestamp)
            latest.set(key, completion)
    })

    return latest
}

const getHabitOccurrences = (
    habit: ScheduleAnalysisHabit,
    completionByHabitAndDate: Map<string, ScheduleAnalysisCompletion>,
    now: Date,
): HabitOccurrence[] => {
    if (habit.status === 'paused' || !habit.weekDays.length) return []

    const today = normalizeLocalDate(now)
    const occurrences: HabitOccurrence[] = []

    for (let daysAgo = 1; daysAgo <= analysisHistoryDays; daysAgo += 1) {
        const date = new Date(today)
        date.setDate(date.getDate() - daysAgo)
        if (!habit.weekDays.includes(getWeekDay(date))) continue
        if (habit.createdAt && date < normalizeLocalDate(habit.createdAt))
            continue
        if (
            habit.seasonalStart &&
            date < normalizeLocalDate(habit.seasonalStart)
        )
            continue
        if (habit.seasonalEnd && date > normalizeLocalDate(habit.seasonalEnd))
            continue

        const completion = completionByHabitAndDate.get(
            getCompletionKey(habit.id, date),
        )
        occurrences.push({
            date,
            status: completion?.status ?? 'missed',
            completionTime: completion?.completionTime,
            preferredTime: habit.preferredTime,
        })
    }

    return occurrences
}

const getOutcomeScore = (status: string) => {
    if (status === 'completed') return 1
    if (status === 'partial') return 0.5
    return 0
}

const getStats = (occurrences: readonly HabitOccurrence[]) => {
    const score = occurrences.reduce(
        (total, occurrence) => total + getOutcomeScore(occurrence.status),
        0,
    )

    return {
        occurrenceCount: occurrences.length,
        successRate: occurrences.length ? score / occurrences.length : 0,
    }
}

const addToBucket = (bucket: TimeBucket | undefined, score: number) => ({
    score: (bucket?.score ?? 0) + score,
    count: (bucket?.count ?? 0) + 1,
})

const getBucketRate = (bucket?: TimeBucket) =>
    bucket && bucket.count ? bucket.score / bucket.count : 0

const getProductiveTimeBuckets = (
    habits: readonly ScheduleAnalysisHabit[],
    occurrencesByHabitId: Map<string, HabitOccurrence[]>,
    statsByHabitId: Map<string, ReturnType<typeof getStats>>,
) => {
    const byHour = new Map<number, TimeBucket>()
    const byWeekDayAndHour = new Map<string, TimeBucket>()

    habits.forEach(habit => {
        const stats = statsByHabitId.get(habit.id)
        if (
            !stats ||
            stats.occurrenceCount < minimumAnalysisOccurrences ||
            stats.successRate < productiveSuccessThreshold
        )
            return

        occurrencesByHabitId.get(habit.id)?.forEach(occurrence => {
            const time = occurrence.completionTime ?? occurrence.preferredTime
            if (!time) return

            const hour = time.getHours()
            const score = getOutcomeScore(occurrence.status)
            byHour.set(hour, addToBucket(byHour.get(hour), score))

            const key = `${getWeekDay(occurrence.date)}:${hour}`
            byWeekDayAndHour.set(
                key,
                addToBucket(byWeekDayAndHour.get(key), score),
            )
        })
    })

    return { byHour, byWeekDayAndHour }
}

const overlaps = (
    start: number,
    end: number,
    otherStart: number,
    otherEnd: number,
) => start < otherEnd && otherStart < end

const isHabitSlotAvailable = (
    habit: ScheduleAnalysisHabit,
    weekDay: number,
    hour: number,
    habits: readonly ScheduleAnalysisHabit[],
    events: readonly ScheduleAnalysisEvent[],
    now: Date,
) => {
    const duration = Math.max(1, habit.estimatedDurationMinutes ?? 60)
    const start = hour * 60
    const end = start + duration

    // Historical reference habits still occupy their recurring weekday slot.
    const hasHabitConflict = habits.some(otherHabit => {
        if (
            otherHabit.id === habit.id ||
            otherHabit.status === 'paused' ||
            !otherHabit.weekDays.includes(weekDay) ||
            !otherHabit.preferredTime
        )
            return false

        const otherStart =
            otherHabit.preferredTime.getHours() * 60 +
            otherHabit.preferredTime.getMinutes()
        const otherEnd =
            otherStart + Math.max(1, otherHabit.estimatedDurationMinutes ?? 60)

        return overlaps(start, end, otherStart, otherEnd)
    })
    if (hasHabitConflict) return false

    const horizonDays = 28
    for (let daysAhead = 0; daysAhead < horizonDays; daysAhead += 1) {
        const date = normalizeLocalDate(now)
        date.setDate(date.getDate() + daysAhead)
        if (getWeekDay(date) !== weekDay) continue

        const hasEventConflict = events.some(event => {
            if (localDateKey(event.dateTime) !== localDateKey(date))
                return false

            const eventStart =
                event.dateTime.getHours() * 60 + event.dateTime.getMinutes()
            const eventEnd = event.endTime
                ? event.endTime.getHours() * 60 + event.endTime.getMinutes()
                : eventStart + 60

            return overlaps(
                start,
                end,
                eventStart,
                Math.max(eventStart + 1, eventEnd),
            )
        })
        if (hasEventConflict) return false
    }

    return true
}

const makeSuggestions = (
    habit: ScheduleAnalysisHabit,
    habits: readonly ScheduleAnalysisHabit[],
    events: readonly ScheduleAnalysisEvent[],
    productiveBuckets: ReturnType<typeof getProductiveTimeBuckets>,
    now: Date,
): HabitScheduleSuggestion[] => {
    const frequency = Math.max(1, new Set(habit.weekDays).size)
    const productiveHours = [...productiveBuckets.byHour.entries()]
        .filter(
            ([, bucket]) =>
                bucket.count >= minimumTimeSlotOccurrences &&
                getBucketRate(bucket) >= productiveSuccessThreshold,
        )
        .sort((left, right) => getBucketRate(right[1]) - getBucketRate(left[1]))

    const suggestions: HabitScheduleSuggestion[] = []

    productiveHours.forEach(([hour, bucket]) => {
        const availableDays = weekDays
            .map(weekDay => {
                const specificBucket = productiveBuckets.byWeekDayAndHour.get(
                    `${weekDay}:${hour}`,
                )
                const specificRate = getBucketRate(specificBucket)
                const hasSpecificEvidence =
                    (specificBucket?.count ?? 0) >= minimumTimeSlotOccurrences

                return {
                    weekDay,
                    rate: hasSpecificEvidence
                        ? specificRate
                        : getBucketRate(bucket),
                    hasSpecificEvidence,
                }
            })
            .filter(
                ({ weekDay, rate }) =>
                    rate >= productiveSuccessThreshold &&
                    isHabitSlotAvailable(
                        habit,
                        weekDay,
                        hour,
                        habits,
                        events,
                        now,
                    ),
            )
            .sort((left, right) => {
                if (left.hasSpecificEvidence !== right.hasSpecificEvidence)
                    return (
                        Number(right.hasSpecificEvidence) -
                        Number(left.hasSpecificEvidence)
                    )
                if (left.rate !== right.rate) return right.rate - left.rate
                return (
                    Number(habit.weekDays.includes(right.weekDay)) -
                    Number(habit.weekDays.includes(left.weekDay))
                )
            })

        if (availableDays.length < frequency) return

        const days = availableDays
            .slice(0, frequency)
            .map(candidate => candidate.weekDay)
            .sort((left, right) => left - right)
        const time = new Date(now)
        time.setHours(hour, 0, 0, 0)
        suggestions.push({
            days,
            time,
            successRate: getBucketRate(bucket),
            sampleCount: bucket.count,
        })
    })

    const uniqueSuggestions = new Map<string, HabitScheduleSuggestion>()
    suggestions.forEach(suggestion => {
        const key = `${suggestion.days.join(',')}:${suggestion.time.getHours()}`
        if (!uniqueSuggestions.has(key)) uniqueSuggestions.set(key, suggestion)
    })

    return [...uniqueSuggestions.values()].slice(0, 3)
}

export const analyzeHabitSchedules = (
    habits: readonly ScheduleAnalysisHabit[],
    completions: readonly ScheduleAnalysisCompletion[],
    events: readonly ScheduleAnalysisEvent[],
    now = new Date(),
): HabitScheduleAnalysis[] => {
    const completionByHabitAndDate =
        getLatestCompletionByHabitAndDate(completions)
    const occurrencesByHabitId = new Map<string, HabitOccurrence[]>()
    const statsByHabitId = new Map<string, ReturnType<typeof getStats>>()

    habits.forEach(habit => {
        const occurrences = getHabitOccurrences(
            habit,
            completionByHabitAndDate,
            now,
        )
        occurrencesByHabitId.set(habit.id, occurrences)
        statsByHabitId.set(habit.id, getStats(occurrences))
    })

    const productiveBuckets = getProductiveTimeBuckets(
        habits,
        occurrencesByHabitId,
        statsByHabitId,
    )

    return habits.map(habit => {
        const stats = statsByHabitId.get(habit.id) ?? {
            occurrenceCount: 0,
            successRate: 0,
        }
        const hasEnoughHistory =
            stats.occurrenceCount >= minimumAnalysisOccurrences

        return {
            habitId: habit.id,
            occurrenceCount: stats.occurrenceCount,
            successRate: stats.successRate,
            hasEnoughHistory,
            isLowSuccess:
                hasEnoughHistory && stats.successRate < lowSuccessThreshold,
            suggestions: makeSuggestions(
                habit,
                habits,
                events,
                productiveBuckets,
                now,
            ),
        }
    })
}
