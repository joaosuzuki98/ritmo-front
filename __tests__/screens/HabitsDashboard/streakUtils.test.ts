import {
    calculateHabitStreak,
    getConditionEligibleDateKeys,
} from '../../../src/screens/HabitsDashboard/streakUtils'

describe('calculateHabitStreak', () => {
    it('counts consecutive daily completions and recognizes missed days', () => {
        const streak = calculateHabitStreak(
            [
                { date: new Date(2026, 8, 27), status: 'completed' },
                { date: new Date(2026, 8, 28), status: 'completed' },
            ],
            [1, 2, 3, 4, 5, 6, 7],
            new Date(2026, 8, 28),
        )

        expect(streak).toEqual({ currentStreak: 2, longestStreak: 2 })

        const afterMissedDay = calculateHabitStreak(
            [
                { date: new Date(2026, 8, 26), status: 'completed' },
                { date: new Date(2026, 8, 28), status: 'completed' },
            ],
            [1, 2, 3, 4, 5, 6, 7],
            new Date(2026, 8, 28),
        )

        expect(afterMissedDay).toEqual({ currentStreak: 1, longestStreak: 1 })
    })

    it('counts only scheduled weekdays for a weekly habit', () => {
        const streak = calculateHabitStreak(
            [
                { date: new Date(2026, 8, 21), status: 'completed' },
                { date: new Date(2026, 8, 23), status: 'completed' },
                { date: new Date(2026, 8, 28), status: 'completed' },
            ],
            [1, 3],
            new Date(2026, 8, 28),
        )

        expect(streak).toEqual({ currentStreak: 3, longestStreak: 3 })
    })

    it('uses the latest status for duplicate records on a day', () => {
        const streak = calculateHabitStreak(
            [
                {
                    date: new Date(2026, 8, 28, 9),
                    status: 'completed',
                    updatedAt: new Date(2026, 8, 28, 9),
                },
                {
                    date: new Date(2026, 8, 28, 9),
                    status: 'skipped',
                    updatedAt: new Date(2026, 8, 28, 10),
                },
            ],
            [1, 2, 3, 4, 5, 6, 7],
            new Date(2026, 8, 28),
        )

        expect(streak).toEqual({ currentStreak: 0, longestStreak: 0 })
    })

    it('ignores scheduled days when a conditional habit was not eligible', () => {
        const eligibleDateKeys = getConditionEligibleDateKeys(
            [
                {
                    habitId: 'condition',
                    date: new Date(2026, 8, 21),
                    status: 'completed',
                },
                {
                    habitId: 'condition',
                    date: new Date(2026, 8, 22),
                    status: 'skipped',
                },
                {
                    habitId: 'condition',
                    date: new Date(2026, 8, 23),
                    status: 'completed',
                },
            ],
            'condition',
            'completed',
        )
        const streak = calculateHabitStreak(
            [
                { date: new Date(2026, 8, 21), status: 'completed' },
                { date: new Date(2026, 8, 23), status: 'completed' },
            ],
            [1, 2, 3, 4, 5, 6, 7],
            new Date(2026, 8, 23),
            eligibleDateKeys,
        )

        expect(streak).toEqual({ currentStreak: 2, longestStreak: 2 })
    })
})
