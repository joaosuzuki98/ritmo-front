import type { Habit, HabitCondition, HabitDependency } from '../../database'

export type FocusHabitEntry = {
    id: string
    label: string
    depth: number
    isFocusOfDay: boolean
    parentLabel?: string
}

export type FocusHabitGroup = {
    id: string
    entries: FocusHabitEntry[]
}

export const buildFocusHabitGroups = (
    habits: readonly Pick<
        Habit,
        'id' | 'userId' | 'name' | 'status' | 'isFocusOfDay'
    >[],
    conditions: readonly Pick<
        HabitCondition,
        'habitId' | 'conditionHabitId' | 'conditionType'
    >[],
    dependencies: readonly Pick<
        HabitDependency,
        'habitId' | 'triggerHabitId' | 'type'
    >[],
    userId: string,
): FocusHabitGroup[] => {
    const ownedHabits = habits.filter(
        habit =>
            habit.userId === userId &&
            habit.status !== 'deleted' &&
            habit.name.trim().length > 0,
    )
    const byId = new Map(ownedHabits.map(habit => [habit.id, habit]))
    const children = new Map<string, Set<string>>()
    const childIds = new Set<string>()
    const addRelation = (parentId: string, childId: string) => {
        if (!byId.has(parentId) || !byId.has(childId) || parentId === childId)
            return
        const siblings = children.get(parentId) ?? new Set<string>()
        siblings.add(childId)
        children.set(parentId, siblings)
        childIds.add(childId)
    }

    conditions.forEach(condition => {
        if (condition.conditionType === 'habit_status')
            addRelation(condition.conditionHabitId, condition.habitId)
    })
    dependencies.forEach(dependency => {
        if (dependency.type === 'after_completion')
            addRelation(dependency.triggerHabitId, dependency.habitId)
    })

    const groups: FocusHabitGroup[] = []
    const renderedIds = new Set<string>()
    const addGroup = (rootId: string) => {
        const entries: FocusHabitEntry[] = []
        const visited = new Set<string>()
        const visit = (id: string, depth: number, parentLabel?: string) => {
            const habit = byId.get(id)
            if (!habit || visited.has(id)) return
            visited.add(id)
            renderedIds.add(id)
            entries.push({
                id,
                label: habit.name,
                depth,
                isFocusOfDay: habit.isFocusOfDay,
                parentLabel,
            })
            // Keep the same sibling order as the habit list, not relation creation order.
            ownedHabits.forEach(child => {
                if (children.get(id)?.has(child.id))
                    visit(child.id, depth + 1, habit.name)
            })
        }
        visit(rootId, 0)
        groups.push({ id: rootId, entries })
    }

    ownedHabits
        .filter(habit => !childIds.has(habit.id))
        .forEach(habit => addGroup(habit.id))
    // Old or synced cycles must not hide habits or recurse indefinitely.
    ownedHabits.forEach(habit => {
        if (!renderedIds.has(habit.id)) addGroup(habit.id)
    })
    return groups
}

export const getSelectedFocusGroups = (groups: readonly FocusHabitGroup[]) => {
    return groups
        .map(group => ({
            id: group.id,
            labels: group.entries
                .filter(entry => entry.isFocusOfDay)
                .map(entry => entry.label),
        }))
        .filter(group => group.labels.length > 0)
}
