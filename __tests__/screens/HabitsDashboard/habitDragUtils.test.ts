import {
    getDragTargetIndex,
    getDragTranslationToIndex,
} from '../../../src/screens/HabitsDashboard/habitDragUtils'

describe('habit drag layout calculations', () => {
    const orderedHabitIds = ['short', 'long', 'medium']
    const marginBottom = 20
    const fallbackStep = 188
    const stepsByHabitId = {
        short: 140,
        long: 240,
        medium: 180,
    }

    it('uses measured card centers to choose a target among different heights', () => {
        expect(
            getDragTargetIndex(
                0,
                200,
                orderedHabitIds,
                stepsByHabitId,
                fallbackStep,
                marginBottom,
            ),
        ).toBe(1)
    })

    it('uses actual slot distances when moving cards in either direction', () => {
        expect(
            getDragTranslationToIndex(
                0,
                2,
                orderedHabitIds,
                stepsByHabitId,
                fallbackStep,
            ),
        ).toBe(420)
        expect(
            getDragTranslationToIndex(
                2,
                0,
                orderedHabitIds,
                stepsByHabitId,
                fallbackStep,
            ),
        ).toBe(-380)
    })
})
