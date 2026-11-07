import {
    analyzeHabitSchedules,
    type ScheduleAnalysisCompletion,
    type ScheduleAnalysisHabit,
} from '../../src/habits/habitScheduleAnalysis'

const now = new Date(2026, 10, 7, 12)

const makeHabit = (
    id: string,
    weekDays: number[],
    overrides: Partial<ScheduleAnalysisHabit> = {},
): ScheduleAnalysisHabit => ({
    id,
    name: id,
    status: 'pending',
    weekDays,
    preferredTime: new Date(2026, 10, 7, 19),
    estimatedDurationMinutes: 30,
    createdAt: new Date(2020, 0, 1),
    ...overrides,
})

const makeHistory = (
    habit: ScheduleAnalysisHabit,
    statusForDate: (date: Date) => string,
): ScheduleAnalysisCompletion[] => {
    const completions: ScheduleAnalysisCompletion[] = []
    for (let daysAgo = 1; daysAgo <= 90; daysAgo += 1) {
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        date.setDate(date.getDate() - daysAgo)
        const weekDay = date.getDay() || 7
        if (!habit.weekDays.includes(weekDay)) continue
        const status = statusForDate(date)
        const completionTime = new Date(date)
        completionTime.setHours(
            habit.preferredTime?.getHours() ?? 19,
            habit.preferredTime?.getMinutes() ?? 0,
            0,
            0,
        )
        completions.push({
            habitId: habit.id,
            date,
            status,
            completionTime: status === 'completed' ? completionTime : undefined,
            updatedAt: new Date(date.getTime() + 1000),
        })
    }
    return completions
}

describe('analyzeHabitSchedules', () => {
    it('identifies low success and suggests a free day in a productive hour', () => {
        const strongHabit = makeHabit('strong', [1, 2])
        const lowHabit = makeHabit('low', [1])
        const strongHistory = makeHistory(strongHabit, () => 'completed')
        let lowCompleted = false
        const lowHistory = makeHistory(lowHabit, () => {
            if (!lowCompleted) {
                lowCompleted = true
                return 'completed'
            }
            return 'skipped'
        })

        const analyses = analyzeHabitSchedules(
            [strongHabit, lowHabit],
            [...strongHistory, ...lowHistory],
            [],
            now,
        )
        const analysis = analyses.find(item => item.habitId === lowHabit.id)

        expect(analysis).toMatchObject({
            hasEnoughHistory: true,
            isLowSuccess: true,
        })
        expect(analysis?.successRate).toBeLessThan(0.15)
        expect(analysis?.suggestions[0]).toMatchObject({
            days: [3],
            time: expect.any(Date),
            successRate: 1,
        })
        expect(analysis?.suggestions[0]?.time.getHours()).toBe(19)
    })

    it('does not classify a habit with fewer than eight occurrences', () => {
        const lowHabit = makeHabit('new', [1], {
            createdAt: new Date(2026, 9, 1),
        })

        const [analysis] = analyzeHabitSchedules([lowHabit], [], [], now)

        expect(analysis).toMatchObject({
            hasEnoughHistory: false,
            isLowSuccess: false,
            occurrenceCount: expect.any(Number),
        })
        expect(analysis.occurrenceCount).toBeLessThan(8)
    })

    it('skips a productive day when a calendar event conflicts with the slot', () => {
        const strongHabit = makeHabit('strong', [1, 2])
        const lowHabit = makeHabit('low', [1])
        const strongHistory = makeHistory(strongHabit, () => 'completed')
        let lowCompleted = false
        const lowHistory = makeHistory(lowHabit, () => {
            if (!lowCompleted) {
                lowCompleted = true
                return 'completed'
            }
            return 'skipped'
        })
        const nextWednesday = new Date(now)
        while ((nextWednesday.getDay() || 7) !== 3)
            nextWednesday.setDate(nextWednesday.getDate() + 1)
        nextWednesday.setHours(19, 0, 0, 0)

        const [analysis] = analyzeHabitSchedules(
            [strongHabit, lowHabit],
            [...strongHistory, ...lowHistory],
            [
                {
                    id: 'event-1',
                    title: 'Dinner',
                    dateTime: nextWednesday,
                    endTime: new Date(nextWednesday.getTime() + 60 * 60 * 1000),
                },
            ],
            now,
        ).filter(item => item.habitId === lowHabit.id)

        expect(analysis.suggestions[0]?.days).toEqual([4])
    })

    it('avoids another habit scheduled in the productive time slot', () => {
        const strongHabit = makeHabit('strong', [1, 2])
        const lowHabit = makeHabit('low', [1])
        const conflictingHabit = makeHabit('conflict', [3])
        const strongHistory = makeHistory(strongHabit, () => 'completed')
        let lowCompleted = false
        const lowHistory = makeHistory(lowHabit, () => {
            if (!lowCompleted) {
                lowCompleted = true
                return 'completed'
            }
            return 'skipped'
        })

        const analysis = analyzeHabitSchedules(
            [strongHabit, lowHabit, conflictingHabit],
            [...strongHistory, ...lowHistory],
            [],
            now,
        ).find(item => item.habitId === lowHabit.id)

        expect(analysis?.suggestions[0]?.days).toEqual([4])
    })

    it('recommends free alternate weekdays for seasonal reference habits', () => {
        const morningHabit = makeHabit('morning', [1], {
            preferredTime: new Date(2026, 10, 7, 8),
            seasonalEnd: new Date(2026, 10, 6),
        })
        const eveningHabit = makeHabit('evening', [1], {
            preferredTime: new Date(2026, 10, 7, 17),
            seasonalEnd: new Date(2026, 10, 6),
        })
        const lowHabit = makeHabit('low', [1], {
            preferredTime: new Date(2026, 10, 7, 19),
        })
        const makeStrongHistory = (
            habit: ScheduleAnalysisHabit,
            successes: number,
        ) => {
            let completed = 0
            return makeHistory(habit, () => {
                completed += 1
                return completed <= successes ? 'completed' : 'skipped'
            })
        }
        const morningHistory = makeStrongHistory(morningHabit, 11)
        const eveningHistory = makeStrongHistory(eveningHabit, 12)
        let lowCompleted = false
        const lowHistory = makeHistory(lowHabit, () => {
            if (!lowCompleted) {
                lowCompleted = true
                return 'completed'
            }
            return 'skipped'
        })

        const analysis = analyzeHabitSchedules(
            [morningHabit, eveningHabit, lowHabit],
            [...morningHistory, ...eveningHistory, ...lowHistory],
            [],
            now,
        ).find(item => item.habitId === lowHabit.id)

        expect(
            analysis?.suggestions.map(suggestion => ({
                days: suggestion.days,
                hour: suggestion.time.getHours(),
            })),
        ).toEqual([
            { days: [2], hour: 17 },
            { days: [2], hour: 8 },
        ])
    })
})
