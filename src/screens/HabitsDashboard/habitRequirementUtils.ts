export type HabitRequirementEdge = {
    habitId: string
    requiredHabitId: string
}

export const wouldCreateHabitRequirementCycle = (
    habitId: string,
    requiredHabitIds: readonly string[],
    existingEdges: readonly HabitRequirementEdge[],
): boolean => {
    const requiredByHabit = new Map<string, string[]>()
    existingEdges.forEach(edge => {
        const required = requiredByHabit.get(edge.habitId) ?? []
        required.push(edge.requiredHabitId)
        requiredByHabit.set(edge.habitId, required)
    })

    const reachesHabit = (
        currentHabitId: string,
        visited: Set<string>,
    ): boolean => {
        if (currentHabitId === habitId) return true
        if (visited.has(currentHabitId)) return false
        visited.add(currentHabitId)
        return (requiredByHabit.get(currentHabitId) ?? []).some(requiredId =>
            reachesHabit(requiredId, visited),
        )
    }

    return requiredHabitIds.some(requiredHabitId =>
        reachesHabit(requiredHabitId, new Set()),
    )
}
