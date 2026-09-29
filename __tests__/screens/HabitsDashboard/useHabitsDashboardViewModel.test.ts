import {
    composeHabitCards,
    filterAndSortCards,
    reorderHabitIds,
} from '../../../src/screens/HabitsDashboard/useHabitsDashboardViewModel'

jest.mock('../../../src/database', () => ({ database: {} }))

const habit = (overrides: Record<string, unknown> = {}) =>
    ({
        id: 'habit-1',
        userId: 'user-1',
        categoryId: 'category-1',
        name: 'Read',
        description: 'Ten pages',
        weekDays: [1],
        priority: 'high',
        status: 'pending',
        isFocusOfDay: false,
        ...overrides,
    } as never)

describe('dashboard transformations', () => {
    it('composes owned habits with category, completion, and safe priority data', () => {
        const cards = composeHabitCards(
            [habit()],
            [{ id: 'category-1', userId: 'user-1', name: 'Learning' }],
            [],
            'user-1',
            1,
            new Date(2026, 8, 21),
        )
        expect(cards[0]).toMatchObject({
            title: 'Read',
            categoryLabel: 'Learning',
            priorityLabel: 'High',
        })
    })

    it('presents paused habits independently from their daily completion', () => {
        const cards = composeHabitCards(
            [habit({ status: 'paused' })],
            [],
            [
                {
                    habitId: 'habit-1',
                    date: new Date(2026, 8, 21),
                    status: 'completed',
                    updatedAt: new Date(2026, 8, 21, 12),
                },
            ] as never,
            'user-1',
            1,
            new Date(2026, 8, 21),
        )

        expect(cards[0]).toMatchObject({
            isPaused: true,
            status: 'paused',
            statusLabel: 'Paused',
        })
    })

    it('includes partial records in habit progress totals and rate', () => {
        const cards = composeHabitCards(
            [habit()],
            [],
            [
                {
                    habitId: 'habit-1',
                    date: new Date(2026, 8, 21),
                    status: 'completed',
                },
                {
                    habitId: 'habit-1',
                    date: new Date(2026, 8, 20),
                    status: 'partial',
                },
                {
                    habitId: 'habit-1',
                    date: new Date(2026, 8, 19),
                    status: 'skipped',
                    incompletionReasonId: 'reason-1',
                },
            ] as never,
            'user-1',
            1,
            new Date(2026, 8, 21),
            [],
            [],
            [{ id: 'reason-1', description: 'Not enough time' }],
        )

        expect(cards[0]).toMatchObject({
            completedCount: 1,
            partialCount: 1,
            skippedCount: 1,
            successRate: 50,
        })
        expect(cards[0].completionHistory).toContainEqual(
            expect.objectContaining({
                status: 'skipped',
                incompletionReason: 'Not enough time',
            }),
        )
    })

    it('shows streak values recalculated from completed habit history', () => {
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const weekDay = today.getDay() || 7
        const cards = composeHabitCards(
            [habit({ weekDays: [1, 2, 3, 4, 5, 6, 7] })],
            [],
            [
                { habitId: 'habit-1', date: yesterday, status: 'completed' },
                { habitId: 'habit-1', date: today, status: 'completed' },
            ] as never,
            'user-1',
            weekDay as never,
            today,
            [],
            [{ habitId: 'habit-1', currentStreak: 1, longestStreak: 1 }],
        )

        expect(cards[0]).toMatchObject({
            currentStreak: 2,
            longestStreak: 2,
        })
    })

    it('blocks chained habits until their prerequisite is completed that day', () => {
        const dependent = habit({
            id: 'dependent',
            name: 'Journal',
        })
        const prerequisite = habit({
            id: 'prerequisite',
            name: 'Meditate',
            weekDays: [2],
        })
        const options = [dependent, prerequisite] as never
        const dependency = [
            {
                habitId: 'dependent',
                triggerHabitId: 'prerequisite',
                type: 'after_completion',
            },
        ] as never

        const blockedCards = composeHabitCards(
            options,
            [],
            [],
            'user-1',
            1,
            new Date(2026, 8, 21),
            [],
            [],
            [],
            dependency,
        )
        expect(
            blockedCards.find(card => card.id === 'dependent'),
        ).toMatchObject({
            isBlocked: true,
            blockingHabitTitles: ['Meditate'],
        })
        expect(
            blockedCards.find(card => card.id === 'prerequisite')
                ?.isPrerequisiteOnly,
        ).toBe(true)

        const unblockedCards = composeHabitCards(
            options,
            [],
            [
                {
                    habitId: 'prerequisite',
                    date: new Date(2026, 8, 21),
                    status: 'completed',
                },
            ] as never,
            'user-1',
            1,
            new Date(2026, 8, 21),
            [],
            [],
            [],
            dependency,
        )
        expect(
            unblockedCards.find(card => card.id === 'dependent')?.isBlocked,
        ).toBe(false)
    })

    it('blocks a habit until another habit reaches the configured condition status', () => {
        const cards = composeHabitCards(
            [
                habit({ id: 'dependent', name: 'Go outside' }),
                habit({ id: 'condition', name: 'Exercise', weekDays: [2] }),
            ] as never,
            [],
            [
                {
                    habitId: 'condition',
                    date: new Date(2026, 8, 21),
                    status: 'partial',
                },
            ] as never,
            'user-1',
            1,
            new Date(2026, 8, 21),
            [],
            [],
            [],
            [],
            [
                {
                    habitId: 'dependent',
                    conditionHabitId: 'condition',
                    conditionType: 'habit_status',
                    conditionRule: { status: 'completed' },
                },
            ] as never,
        )

        expect(cards.find(card => card.id === 'dependent')).toMatchObject({
            isBlocked: true,
            blockingHabitTitles: ['Exercise'],
        })
    })

    it('filters case-insensitively and restores manual order when sorting clears', () => {
        const cards = [
            {
                id: 'a',
                title: 'Write',
                priority: 'low',
                status: 'pending',
                manualIndex: 0,
            },
            {
                id: 'b',
                title: 'Read',
                priority: 'high',
                status: 'completed',
                manualIndex: 1,
            },
        ] as never
        expect(
            filterAndSortCards(cards, 'READ', null).map(card => card.id),
        ).toEqual(['b'])
        expect(
            filterAndSortCards(cards, '', null).map(card => card.id),
        ).toEqual(['a', 'b'])
        expect(
            filterAndSortCards(cards, '', 'title').map(card => card.id),
        ).toEqual(['b', 'a'])
    })

    it('keeps paused habits after active habits in every sort mode', () => {
        const cards = [
            { id: 'paused', title: 'A habit', isPaused: true },
            { id: 'active', title: 'Z habit', isPaused: false },
        ] as never

        expect(
            filterAndSortCards(cards, '', null).map(card => card.id),
        ).toEqual(['active', 'paused'])
        expect(
            filterAndSortCards(cards, '', 'title').map(card => card.id),
        ).toEqual(['active', 'paused'])
    })

    it('does not move an item outside valid bounds', () => {
        expect(reorderHabitIds(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a'])
        expect(reorderHabitIds(['a', 'b'], 0, 4)).toEqual(['a', 'b'])
    })
})
