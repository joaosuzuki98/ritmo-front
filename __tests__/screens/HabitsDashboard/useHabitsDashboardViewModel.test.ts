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

    it('does not move an item outside valid bounds', () => {
        expect(reorderHabitIds(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a'])
        expect(reorderHabitIds(['a', 'b'], 0, 4)).toEqual(['a', 'b'])
    })
})
