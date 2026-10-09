export type HabitCardSteps = Readonly<Record<string, number>>

export const getDragTargetIndex = (
    sourceIndex: number,
    translationY: number,
    orderedHabitIds: readonly string[],
    stepsByHabitId: HabitCardSteps,
    fallbackStep: number,
    marginBottom: number,
): number => {
    'worklet'

    if (
        sourceIndex < 0 ||
        sourceIndex >= orderedHabitIds.length ||
        orderedHabitIds.length === 0
    )
        return sourceIndex

    const getStep = (index: number) =>
        stepsByHabitId[orderedHabitIds[index]] ?? fallbackStep
    let sourceTop = 0
    for (let index = 0; index < sourceIndex; index += 1)
        sourceTop += getStep(index)

    const sourceHeight = Math.max(0, getStep(sourceIndex) - marginBottom)
    const draggedCenter = sourceTop + sourceHeight / 2 + translationY
    let targetIndex = 0
    let top = 0

    for (let index = 0; index < orderedHabitIds.length; index += 1) {
        const step = getStep(index)
        const height = Math.max(0, step - marginBottom)
        if (draggedCenter >= top + height / 2) targetIndex = index
        top += step
    }

    return Math.max(0, Math.min(orderedHabitIds.length - 1, targetIndex))
}

export const getDragTranslationToIndex = (
    sourceIndex: number,
    targetIndex: number,
    orderedHabitIds: readonly string[],
    stepsByHabitId: HabitCardSteps,
    fallbackStep: number,
): number => {
    'worklet'

    if (
        sourceIndex < 0 ||
        sourceIndex >= orderedHabitIds.length ||
        targetIndex < 0 ||
        targetIndex >= orderedHabitIds.length
    )
        return 0

    const getStep = (index: number) =>
        stepsByHabitId[orderedHabitIds[index]] ?? fallbackStep
    const start = targetIndex > sourceIndex ? sourceIndex + 1 : targetIndex
    const end = targetIndex > sourceIndex ? targetIndex + 1 : sourceIndex
    let distance = 0

    for (let index = start; index < end; index += 1) distance += getStep(index)

    return targetIndex > sourceIndex ? distance : -distance
}
