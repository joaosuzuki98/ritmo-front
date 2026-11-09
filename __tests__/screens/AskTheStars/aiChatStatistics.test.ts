import type {
    Category,
    CompletionRecord,
    Habit,
    IncompletionReason,
} from '../../../src/database'
import { buildAiChatStatistics } from '../../../src/screens/AskTheStars/aiChatStatistics'

const makeHabit = (id: string, categoryId?: string) =>
    ({
        id,
        name: `Habit ${id}`,
        userId: 'user-1',
        categoryId,
        status: 'pending',
        frequencyType: 'daily',
        weekDays: [1, 2, 3, 4, 5, 6, 7],
        estimatedDurationMinutes: 10,
        preferredTime: new Date(2026, 0, 1, 8),
    } as unknown as Habit)

describe('buildAiChatStatistics', () => {
    it('calculates local period, weekday, category, goal, and weekly aggregates', () => {
        const now = new Date(2026, 10, 9, 12)
        const habits = [makeHabit('h1', 'c1')]
        const completions = [
            {
                id: 'r1',
                habitId: 'h1',
                date: new Date(2026, 10, 9),
                completionTime: new Date(2026, 10, 9, 8, 30),
                status: 'completed',
            },
        ] as unknown as CompletionRecord[]
        const result = buildAiChatStatistics({
            habits,
            completions,
            categories: [
                { id: 'c1', name: 'Health', userId: 'user-1' } as Category,
            ],
            goals: [],
            reasons: [],
            now,
        })

        expect(result.periods).toHaveLength(4)
        expect(result.periods?.[3]).toMatchObject({
            planned: 1,
            completed: 1,
            completionRate: 1,
        })
        expect(
            result.weekdays?.find(item => item.weekDay === 1)?.completionRate,
        ).toBe(0.25)
        expect(
            result.timeOfDay?.find(item => item.label === 'morning'),
        ).toMatchObject({
            planned: 28,
            completed: 1,
            completionRate: 1 / 28,
        })
        expect(result.categories?.[0]).toMatchObject({
            name: 'Health',
            habitCount: 1,
            completionRate: 1 / 28,
        })
        expect(result.weeklyLoad).toMatchObject({
            plannedSessions: 1,
            estimatedMinutes: 10,
            completionRate: 1,
        })
        expect(result.habits?.[0]).toMatchObject({
            habitId: 'h1',
            completed: 1,
            currentStreak: expect.any(Number),
        })
    })

    it('uses null for ratios without a denominator and sends no raw completion rows', () => {
        const result = buildAiChatStatistics({
            habits: [],
            completions: [],
            categories: [],
            goals: [],
            reasons: [] as IncompletionReason[],
            now: new Date(2026, 10, 9),
        })

        expect(result.weeklyLoad?.completionRate).toBeNull()
        expect(
            result.periods?.every(period => period.completionRate === null),
        ).toBe(true)
        expect(result).not.toHaveProperty('completionRecords')
    })

    it('calculates a correlation only from sufficient overlapping scheduled samples', () => {
        const now = new Date(2026, 10, 9, 12)
        const habits = [makeHabit('h1'), makeHabit('h2')]
        const completions = Array.from({ length: 28 }, (_, index) => {
            const date = new Date(now)
            date.setDate(date.getDate() - index)
            const status = index % 2 === 0 ? 'completed' : 'skipped'
            return ['h1', 'h2'].map(habitId => ({ habitId, date, status }))
        }).flat() as unknown as CompletionRecord[]
        const result = buildAiChatStatistics({
            habits,
            completions,
            categories: [],
            goals: [],
            reasons: [],
            now,
        })

        expect(result.correlations).toHaveLength(1)
        expect(result.correlations?.[0]).toMatchObject({
            habitA: 'Habit h1',
            habitB: 'Habit h2',
            coefficient: 1,
            sampleSize: 28,
        })
    })
})
