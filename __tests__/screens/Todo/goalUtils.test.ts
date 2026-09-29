import {
    calculateGroupGoalProgress,
    countCompletedHabitOccurrences,
    getGoalEndDate,
    getGoalProgressPercent,
} from '../../../src/screens/Todo/goalUtils'

describe('goal progress calculations', () => {
    it('sets short, medium, and long goal horizons', () => {
        const startDate = new Date(2026, 0, 1)
        expect(getGoalEndDate(startDate, 'short')).toEqual(
            new Date(2026, 0, 30),
        )
        expect(getGoalEndDate(startDate, 'medium')).toEqual(
            new Date(2026, 2, 31),
        )
        expect(getGoalEndDate(startDate, 'long')).toEqual(
            new Date(2026, 11, 31),
        )
    })

    it('counts unique completed habit days since the goal began', () => {
        const goal = {
            habitId: 'habit-1',
            createdAt: new Date(2026, 0, 5),
        }
        const completions = [
            {
                habitId: 'habit-1',
                date: new Date(2026, 0, 4),
                status: 'completed',
                updatedAt: new Date(2026, 0, 4, 9),
            },
            {
                habitId: 'habit-1',
                date: new Date(2026, 0, 5),
                status: 'completed',
                updatedAt: new Date(2026, 0, 5, 9),
            },
            {
                habitId: 'habit-1',
                date: new Date(2026, 0, 5),
                status: 'skipped',
                updatedAt: new Date(2026, 0, 5, 10),
            },
            {
                habitId: 'habit-1',
                date: new Date(2026, 0, 6),
                status: 'completed',
                updatedAt: new Date(2026, 0, 6, 9),
            },
        ] as never

        expect(
            countCompletedHabitOccurrences(
                goal as never,
                completions,
                new Date(2026, 0, 6, 12),
            ),
        ).toBe(1)
    })

    it('calculates group consistency from scheduled elapsed occurrences', () => {
        const progress = calculateGroupGoalProgress(
            {
                includedHabitIds: ['daily', 'weekdays'],
                periodStart: new Date(2026, 5, 1),
                periodEnd: new Date(2026, 5, 30),
            } as never,
            [
                {
                    id: 'daily',
                    frequencyType: 'daily',
                    weekDays: [1, 2, 3, 4, 5, 6, 7],
                },
                {
                    id: 'weekdays',
                    frequencyType: 'weekly',
                    weekDays: [1, 3],
                },
            ],
            [
                {
                    habitId: 'daily',
                    date: new Date(2026, 5, 1),
                    status: 'completed',
                    updatedAt: new Date(2026, 5, 1, 9),
                },
                {
                    habitId: 'daily',
                    date: new Date(2026, 5, 2),
                    status: 'completed',
                    updatedAt: new Date(2026, 5, 2, 9),
                },
                {
                    habitId: 'weekdays',
                    date: new Date(2026, 5, 1),
                    status: 'completed',
                    updatedAt: new Date(2026, 5, 1, 10),
                },
            ] as never,
            new Date(2026, 5, 3, 12),
        )

        expect(progress).toEqual({
            expectedOccurrences: 5,
            completedOccurrences: 3,
            actualPercentage: 60,
        })
    })

    it('caps goal progress at full completion', () => {
        expect(getGoalProgressPercent(15, 10)).toBe(100)
    })
})
