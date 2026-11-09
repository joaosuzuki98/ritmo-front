import { buildWeeklyHabitLoadNotificationPlan } from '../../src/notifications/weeklyHabitLoadNotification'
import type {
    HabitLoadCompletion,
    HabitLoadHabit,
} from '../../src/habits/habitLoadAnalysis'

const now = new Date(2026, 10, 7, 12)
const habits: HabitLoadHabit[] = Array.from({ length: 5 }, (_, index) => ({
    id: `habit-${index}`,
    name: `Habit ${index}`,
    status: 'pending',
    weekDays: [1, 3],
    createdAt: new Date(2020, 0, 1),
}))

const makeCompletions = (
    weeklyRates: number[],
    nowDate = now,
): HabitLoadCompletion[] => {
    const currentMonday = new Date(
        nowDate.getFullYear(),
        nowDate.getMonth(),
        nowDate.getDate(),
    )
    currentMonday.setDate(
        currentMonday.getDate() - ((currentMonday.getDay() + 6) % 7),
    )
    const completions: HabitLoadCompletion[] = []
    weeklyRates.forEach((rate, weekIndex) => {
        const start = new Date(currentMonday)
        start.setDate(start.getDate() - (weeklyRates.length - weekIndex) * 7)
        const completedOccurrences = Math.round(rate * habits.length * 2)
        let index = 0
        for (let day = 0; day < 7; day += 1) {
            const date = new Date(start)
            date.setDate(date.getDate() + day)
            habits.forEach(habit => {
                if (!habit.weekDays.includes(date.getDay() || 7)) return
                if (index < completedOccurrences)
                    completions.push({
                        habitId: habit.id,
                        date,
                        status: 'completed',
                    })
                index += 1
            })
        }
    })
    return completions
}

describe('buildWeeklyHabitLoadNotificationPlan', () => {
    it('does not create a plan when the option is disabled or there is no recommendation', () => {
        const highCompletion = makeCompletions([0.9, 0.9, 0.9, 0.9])
        expect(
            buildWeeklyHabitLoadNotificationPlan(
                habits,
                highCompletion,
                [],
                false,
                now,
            ),
        ).toBeNull()
        expect(
            buildWeeklyHabitLoadNotificationPlan(
                habits,
                makeCompletions([0.5, 0.5, 0.5, 0.5]),
                [],
                true,
                now,
            ),
        ).toBeNull()
    })

    it('schedules a reduction recommendation for Monday after the previous week', () => {
        const plan = buildWeeklyHabitLoadNotificationPlan(
            habits,
            makeCompletions([0.2, 0.2, 0.2, 0.2]),
            [],
            true,
            now,
        )

        expect(plan).toMatchObject({
            kind: 'reduce',
            title: 'A lighter habit routine may help',
            body: expect.stringContaining('20%'),
            scheduledAt: new Date(2026, 10, 9, 9),
        })
    })

    it('schedules the next Monday when the manager starts after notification time', () => {
        const mondayAfterNine = new Date(2026, 10, 9, 10)
        const plan = buildWeeklyHabitLoadNotificationPlan(
            habits,
            makeCompletions([0.9, 0.9, 0.9, 0.9], mondayAfterNine),
            [],
            true,
            mondayAfterNine,
        )

        expect(plan?.kind).toBe('increase')
        expect(plan?.scheduledAt).toEqual(new Date(2026, 10, 16, 9))
    })
})
