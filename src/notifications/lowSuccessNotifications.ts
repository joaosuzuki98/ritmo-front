import { analyzeHabitSchedules } from '../habits/habitScheduleAnalysis'
import type {
    ScheduleAnalysisCompletion,
    ScheduleAnalysisHabit,
} from '../habits/habitScheduleAnalysis'
import type { LowSuccessNotificationState } from './notificationPreferences'

const minimumNotificationIntervalMs = 48 * 60 * 60 * 1000

export type LowSuccessNotification = {
    habitId: string
    habitName: string
    successRate: number
    notifiedAt: number
}

export type LowSuccessNotificationEvaluation = {
    notifications: LowSuccessNotification[]
    state: LowSuccessNotificationState
}

export const evaluateLowSuccessNotifications = (
    habits: readonly ScheduleAnalysisHabit[],
    completions: readonly ScheduleAnalysisCompletion[],
    previousState: LowSuccessNotificationState,
    {
        enabled,
        hasPermission,
        now = new Date(),
    }: { enabled: boolean; hasPermission: boolean; now?: Date },
): LowSuccessNotificationEvaluation => {
    const analyses = analyzeHabitSchedules(habits, completions, [], now)
    const analysisByHabitId = new Map(
        analyses.map(analysis => [analysis.habitId, analysis]),
    )
    const state: LowSuccessNotificationState = {}
    const notifications: LowSuccessNotification[] = []

    habits.forEach(habit => {
        const analysis = analysisByHabitId.get(habit.id)
        const previous = previousState[habit.id]

        if (!analysis?.isLowSuccess) {
            if (previous) {
                state[habit.id] = {
                    ...previous,
                    isLowEpisode: false,
                    notifiedInEpisode: false,
                    pending: false,
                }
            }
            return
        }

        const current = previous?.isLowEpisode
            ? previous
            : {
                  isLowEpisode: true,
                  notifiedInEpisode: false,
                  lastNotifiedAt: previous?.lastNotifiedAt,
                  pending: true,
              }
        const cooldownElapsed =
            current.lastNotifiedAt === undefined ||
            now.getTime() - current.lastNotifiedAt >=
                minimumNotificationIntervalMs

        if (
            enabled &&
            hasPermission &&
            current.pending &&
            !current.notifiedInEpisode &&
            cooldownElapsed
        ) {
            notifications.push({
                habitId: habit.id,
                habitName: habit.name,
                successRate: analysis.successRate,
                notifiedAt: now.getTime(),
            })
            state[habit.id] = {
                isLowEpisode: true,
                notifiedInEpisode: true,
                lastNotifiedAt: now.getTime(),
                pending: false,
            }
            return
        }

        state[habit.id] = current
    })

    return { notifications, state }
}
