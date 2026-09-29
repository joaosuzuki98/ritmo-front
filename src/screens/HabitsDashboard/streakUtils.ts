import {
    localDateKey,
    normalizeLocalDate,
} from '../../utils/normalizeLocalDate'

export type HabitStreakCompletion = {
    date: Date
    status: string
    updatedAt?: Date
}

export type HabitStreak = {
    currentStreak: number
    longestStreak: number
}

export const calculateHabitStreak = (
    completions: readonly HabitStreakCompletion[],
    weekDays: readonly number[],
    today = new Date(),
): HabitStreak => {
    const scheduledDays = new Set(weekDays)
    if (!scheduledDays.size || !completions.length)
        return { currentStreak: 0, longestStreak: 0 }

    const latestByDate = new Map<string, HabitStreakCompletion>()
    completions.forEach(completion => {
        const key = localDateKey(completion.date)
        const current = latestByDate.get(key)
        if (
            !current ||
            (completion.updatedAt?.getTime() ?? completion.date.getTime()) >=
                (current.updatedAt?.getTime() ?? current.date.getTime())
        )
            latestByDate.set(key, completion)
    })

    const completedDates = new Set(
        [...latestByDate.entries()]
            .filter(([, completion]) => completion.status === 'completed')
            .map(([dateKey]) => dateKey),
    )
    if (!completedDates.size) return { currentStreak: 0, longestStreak: 0 }

    const getWeekDay = (date: Date) => date.getDay() || 7
    const firstDate = normalizeLocalDate(
        [...latestByDate.values()].reduce(
            (earliest, completion) =>
                completion.date < earliest ? completion.date : earliest,
            [...latestByDate.values()][0].date,
        ),
    )
    const todayDate = normalizeLocalDate(today)
    let longestStreak = 0
    let currentLongestStreak = 0

    for (
        let date = new Date(firstDate);
        date <= todayDate;
        date.setDate(date.getDate() + 1)
    ) {
        if (!scheduledDays.has(getWeekDay(date))) continue
        if (completedDates.has(localDateKey(date))) {
            currentLongestStreak += 1
            longestStreak = Math.max(longestStreak, currentLongestStreak)
        } else {
            currentLongestStreak = 0
        }
    }

    let currentStreak = 0
    const cursor = new Date(todayDate)
    if (
        scheduledDays.has(getWeekDay(cursor)) &&
        !completedDates.has(localDateKey(cursor))
    )
        cursor.setDate(cursor.getDate() - 1)

    for (; cursor >= firstDate; cursor.setDate(cursor.getDate() - 1)) {
        if (!scheduledDays.has(getWeekDay(cursor))) continue
        if (!completedDates.has(localDateKey(cursor))) break
        currentStreak += 1
    }

    return { currentStreak, longestStreak }
}
