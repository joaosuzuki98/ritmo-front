import {
    analyzeWeeklyHabitLoad,
    type HabitLoadCompletion,
    type HabitLoadHabit,
} from '../../src/habits/habitLoadAnalysis'

const now = new Date(2026, 10, 7, 12)

const makeHabits = (count = 5): HabitLoadHabit[] =>
    Array.from({ length: count }, (_, index) => ({
        id: `habit-${index + 1}`,
        name: `Habit ${index + 1}`,
        status: 'pending',
        weekDays: [1, 3],
        estimatedDurationMinutes: 20,
        createdAt: new Date(2020, 0, 1),
    }))

const makeWeeklyData = (weeklyRates: number[], habitCount = 5) => {
    const habits = makeHabits(habitCount)
    const currentMonday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
    )
    currentMonday.setDate(
        currentMonday.getDate() - ((currentMonday.getDay() + 6) % 7),
    )
    const completions: HabitLoadCompletion[] = []

    weeklyRates.forEach((rate, weekIndex) => {
        const weekStart = new Date(currentMonday)
        weekStart.setDate(
            weekStart.getDate() - (weeklyRates.length - weekIndex) * 7,
        )
        const completedOccurrences = Math.round(rate * habits.length * 2)
        let occurrenceIndex = 0

        for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
            const date = new Date(weekStart)
            date.setDate(date.getDate() + dayOffset)
            const weekDay = date.getDay() || 7
            habits.forEach(habit => {
                if (!habit.weekDays.includes(weekDay)) return
                if (occurrenceIndex < completedOccurrences)
                    completions.push({
                        habitId: habit.id,
                        date,
                        status: 'completed',
                    })
                occurrenceIndex += 1
            })
        }
    })

    return { habits, completions }
}

describe('analyzeWeeklyHabitLoad', () => {
    it('recommends reducing load after two consecutive low-completion weeks', () => {
        const { habits, completions } = makeWeeklyData([0.3, 0.2, 0.2, 0.2])

        const analysis = analyzeWeeklyHabitLoad(habits, completions, [], now)

        expect(analysis.kind).toBe('reduce')
        if (analysis.kind !== 'reduce') return
        expect(analysis.completionRate).toBeCloseTo(0.2)
        expect(analysis.leastCompletedHabits).toHaveLength(3)
    })

    it('can recommend a reduction once two qualifying consecutive weeks are available', () => {
        const { habits, completions } = makeWeeklyData([0.2, 0.2, 0.2, 0.2])
        habits.forEach(habit => {
            habit.createdAt = new Date(2026, 9, 19)
        })

        const analysis = analyzeWeeklyHabitLoad(habits, completions, [], now)

        expect(analysis.kind).toBe('reduce')
    })

    it('scores completed sessions as 1, partial sessions as 0.5, and missing sessions as 0', () => {
        const { habits, completions } = makeWeeklyData([0.5, 0.5, 0.5, 0.5])
        completions.push({
            habitId: habits[0].id,
            date: new Date(2026, 9, 28),
            status: 'partial',
        })

        const analysis = analyzeWeeklyHabitLoad(habits, completions, [], now)

        expect(analysis.weeklyRates[3].rate).toBeCloseTo(0.55)
    })

    it('recommends increasing load after three high-completion weeks', () => {
        const { habits, completions } = makeWeeklyData([0.9, 0.9, 0.9, 0.6])

        const analysis = analyzeWeeklyHabitLoad(habits, completions, [], now)

        expect(analysis.kind).toBe('increase')
        if (analysis.kind !== 'increase') return
        expect(analysis.completionRate).toBeCloseTo(0.825)
        expect(analysis.lighterDays.map(day => day.weekDay)).toEqual([2, 4, 5])
    })

    it('includes events when ranking candidate lighter weekdays', () => {
        const { habits, completions } = makeWeeklyData([0.9, 0.9, 0.9, 0.6])
        const eventDate = new Date(now)
        eventDate.setDate(eventDate.getDate() + 3)
        eventDate.setHours(10, 0, 0, 0)

        const analysis = analyzeWeeklyHabitLoad(
            habits,
            completions,
            [
                {
                    dateTime: eventDate,
                    endTime: new Date(eventDate.getTime() + 60 * 60 * 1000),
                },
            ],
            now,
        )

        expect(analysis.kind).toBe('increase')
        if (analysis.kind !== 'increase') return
        expect(analysis.lighterDays.map(day => day.weekDay)).toEqual([4, 5, 6])
    })

    it('waits for the minimum number of active habits and scheduled sessions', () => {
        const { habits, completions } = makeWeeklyData([1, 1, 1, 1], 4)

        const analysis = analyzeWeeklyHabitLoad(habits, completions, [], now)

        expect(analysis.kind).toBe('insufficient')
    })

    it('does not recommend a change when weekly consistency is mixed', () => {
        const { habits, completions } = makeWeeklyData([0.2, 0.5, 0.9, 0.7])

        const analysis = analyzeWeeklyHabitLoad(habits, completions, [], now)

        expect(analysis.kind).toBe('balanced')
    })
})
