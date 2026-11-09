import type {
    ScheduleAnalysisCompletion,
    ScheduleAnalysisHabit,
} from '../../src/habits/habitScheduleAnalysis'
import { evaluateLowSuccessNotifications } from '../../src/notifications/lowSuccessNotifications'

const now = new Date(2026, 10, 7, 12)
const habit: ScheduleAnalysisHabit = {
    id: 'habit-low',
    name: 'Read',
    status: 'active',
    weekDays: [1],
    preferredTime: new Date(2026, 10, 7, 19),
    createdAt: new Date(2020, 0, 1),
}

const makeCompletions = (completedCount: number) => {
    const completions: ScheduleAnalysisCompletion[] = []
    let completed = 0

    for (let daysAgo = 1; daysAgo <= 90; daysAgo += 1) {
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        date.setDate(date.getDate() - daysAgo)
        if ((date.getDay() || 7) !== 1) continue
        const status = completed < completedCount ? 'completed' : 'skipped'
        if (status === 'completed') completed += 1
        completions.push({
            habitId: habit.id,
            date,
            status,
            completionTime: status === 'completed' ? new Date(date) : undefined,
        })
    }

    return completions
}

describe('evaluateLowSuccessNotifications', () => {
    it('notifies once per low-success episode and waits 48 hours before a new episode', () => {
        const first = evaluateLowSuccessNotifications(
            [habit],
            makeCompletions(1),
            {},
            { enabled: true, hasPermission: true, now },
        )

        expect(first.notifications).toHaveLength(1)
        expect(first.notifications[0].habitId).toBe(habit.id)

        const stillLow = evaluateLowSuccessNotifications(
            [habit],
            makeCompletions(1),
            first.state,
            {
                enabled: true,
                hasPermission: true,
                now: new Date(now.getTime() + 24 * 60 * 60 * 1000),
            },
        )
        expect(stillLow.notifications).toHaveLength(0)

        const recovered = evaluateLowSuccessNotifications(
            [habit],
            makeCompletions(12),
            stillLow.state,
            {
                enabled: true,
                hasPermission: true,
                now: new Date(now.getTime() + 30 * 60 * 60 * 1000),
            },
        )
        expect(recovered.notifications).toHaveLength(0)
        expect(recovered.state[habit.id].isLowEpisode).toBe(false)

        const pendingRelapse = evaluateLowSuccessNotifications(
            [habit],
            makeCompletions(1),
            recovered.state,
            {
                enabled: true,
                hasPermission: true,
                now: new Date(now.getTime() + 36 * 60 * 60 * 1000),
            },
        )
        expect(pendingRelapse.notifications).toHaveLength(0)
        expect(pendingRelapse.state[habit.id].pending).toBe(true)

        const afterCooldown = evaluateLowSuccessNotifications(
            [habit],
            makeCompletions(1),
            pendingRelapse.state,
            {
                enabled: true,
                hasPermission: true,
                now: new Date(now.getTime() + 49 * 60 * 60 * 1000),
            },
        )
        expect(afterCooldown.notifications).toHaveLength(1)
    })

    it('keeps a low-success alert pending while notifications are disabled or unavailable', () => {
        const disabled = evaluateLowSuccessNotifications(
            [habit],
            makeCompletions(1),
            {},
            { enabled: false, hasPermission: true, now },
        )

        expect(disabled.notifications).toHaveLength(0)
        expect(disabled.state[habit.id].pending).toBe(true)

        const enabled = evaluateLowSuccessNotifications(
            [habit],
            makeCompletions(1),
            disabled.state,
            { enabled: true, hasPermission: true, now },
        )
        expect(enabled.notifications).toHaveLength(1)
    })
})
