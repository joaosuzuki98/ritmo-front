import type { HabitCategoryViewData } from './habitDashboard.types'

type CategoryHabitSource = {
    id: string
    userId: string
    name: string
    categoryId?: string | null
    status: string
}

type CategorySource = {
    id: string
    userId: string
    name: string
}

export type HabitCategoryGroup = {
    label: string
    habits: HabitCategoryViewData[]
    percentage: number
}

export const buildHabitCategoryItems = (
    habits: readonly CategoryHabitSource[],
    categories: readonly CategorySource[],
    userId: string,
): HabitCategoryViewData[] => {
    const categoryNames = new Map(
        categories
            .filter(category => category.userId === userId)
            .map(category => [category.id, category.name]),
    )

    return habits
        .filter(
            habit =>
                habit.userId === userId &&
                habit.status !== 'deleted' &&
                habit.name.trim().length > 0,
        )
        .map(habit => ({
            id: habit.id,
            title: habit.name,
            categoryLabel: habit.categoryId
                ? categoryNames.get(habit.categoryId) ?? ''
                : '',
        }))
}

export const buildHabitCategoryDistribution = (
    habits: readonly HabitCategoryViewData[],
): HabitCategoryGroup[] => {
    if (habits.length === 0) return []

    const habitsByCategory = new Map<string, HabitCategoryViewData[]>()
    habits.forEach(habit => {
        const label = habit.categoryLabel.trim() || 'Uncategorized'
        const categoryHabits = habitsByCategory.get(label) ?? []
        categoryHabits.push(habit)
        habitsByCategory.set(label, categoryHabits)
    })

    return Array.from(habitsByCategory, ([label, categoryHabits]) => ({
        label,
        habits: categoryHabits,
        percentage: Math.round((categoryHabits.length / habits.length) * 100),
    })).sort(
        (left, right) =>
            right.habits.length - left.habits.length ||
            left.label.localeCompare(right.label),
    )
}
