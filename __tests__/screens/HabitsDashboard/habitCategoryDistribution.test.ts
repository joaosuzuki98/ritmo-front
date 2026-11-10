import {
    buildHabitCategoryDistribution,
    buildHabitCategoryItems,
} from '../../../src/screens/HabitsDashboard/habitCategoryDistribution'
import type { HabitCategoryViewData } from '../../../src/screens/HabitsDashboard/habitDashboard.types'

const makeHabit = (
    id: string,
    categoryLabel: string,
): HabitCategoryViewData => ({
    id,
    title: `Habit ${id}`,
    categoryLabel,
})

describe('buildHabitCategoryItems', () => {
    it('includes owned habits from all days and excludes deleted habits', () => {
        const result = buildHabitCategoryItems(
            [
                {
                    id: 'today',
                    userId: 'user-1',
                    name: 'Daily habit',
                    categoryId: 'category-1',
                    status: 'pending',
                },
                {
                    id: 'another-day',
                    userId: 'user-1',
                    name: 'Habit on another day',
                    categoryId: 'category-2',
                    status: 'paused',
                },
                {
                    id: 'deleted',
                    userId: 'user-1',
                    name: 'Removed habit',
                    categoryId: 'category-1',
                    status: 'deleted',
                },
                {
                    id: 'other-user',
                    userId: 'user-2',
                    name: 'Another user habit',
                    categoryId: 'category-1',
                    status: 'pending',
                },
            ],
            [
                { id: 'category-1', userId: 'user-1', name: 'Health' },
                { id: 'category-2', userId: 'user-1', name: 'Learning' },
            ],
            'user-1',
        )

        expect(result).toEqual([
            {
                id: 'today',
                title: 'Daily habit',
                categoryLabel: 'Health',
            },
            {
                id: 'another-day',
                title: 'Habit on another day',
                categoryLabel: 'Learning',
            },
        ])
    })
})

describe('buildHabitCategoryDistribution', () => {
    it('groups habits by category and calculates each category share', () => {
        const result = buildHabitCategoryDistribution([
            makeHabit('1', 'Mind'),
            makeHabit('2', 'Body'),
            makeHabit('3', 'Mind'),
        ])

        expect(result).toEqual([
            {
                label: 'Mind',
                habits: [makeHabit('1', 'Mind'), makeHabit('3', 'Mind')],
                percentage: 67,
            },
            {
                label: 'Body',
                habits: [makeHabit('2', 'Body')],
                percentage: 33,
            },
        ])
    })

    it('uses an uncategorized group when a habit has no category label', () => {
        const result = buildHabitCategoryDistribution([
            makeHabit('1', ''),
            makeHabit('2', '   '),
        ])

        expect(result).toHaveLength(1)
        expect(result[0]).toMatchObject({
            label: 'Uncategorized',
            percentage: 100,
        })
        expect(result[0].habits).toHaveLength(2)
    })

    it('returns no groups when there are no habits', () => {
        expect(buildHabitCategoryDistribution([])).toEqual([])
    })
})
