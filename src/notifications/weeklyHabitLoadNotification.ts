import { analyzeWeeklyHabitLoad } from '../habits/habitLoadAnalysis'
import type {
    HabitLoadCompletion,
    HabitLoadEvent,
    HabitLoadHabit,
} from '../habits/habitLoadAnalysis'
import { normalizeLocalDate } from '../utils/normalizeLocalDate'

export type WeeklyHabitLoadNotificationPlan = {
    kind: 'reduce' | 'increase'
    scheduledAt: Date
    title: string
    body: string
}

const getNextWeeklyNotificationTime = (now: Date) => {
    const date = normalizeLocalDate(now)
    const weekDay = date.getDay() || 7
    date.setDate(date.getDate() + ((8 - weekDay) % 7))
    date.setHours(9, 0, 0, 0)
    if (date <= now) date.setDate(date.getDate() + 7)
    return date
}

export const buildWeeklyHabitLoadNotificationPlan = (
    habits: readonly HabitLoadHabit[],
    completions: readonly HabitLoadCompletion[],
    events: readonly HabitLoadEvent[],
    enabled: boolean,
    now = new Date(),
): WeeklyHabitLoadNotificationPlan | null => {
    if (!enabled) return null

    const analysis = analyzeWeeklyHabitLoad(habits, completions, events, now)
    if (analysis.kind !== 'reduce' && analysis.kind !== 'increase') return null

    const isReduction = analysis.kind === 'reduce'
    const completionPercent = Math.round(analysis.completionRate * 100)
    return {
        kind: analysis.kind,
        scheduledAt: getNextWeeklyNotificationTime(now),
        title: isReduction
            ? 'A lighter habit routine may help'
            : 'Your habit consistency is strong',
        body: isReduction
            ? `You completed ${completionPercent}% of your planned sessions. Ask the Stars to review your weekly load.`
            : `You completed ${completionPercent}% of your planned sessions. Ask the Stars about lighter days for a new habit.`,
    }
}
