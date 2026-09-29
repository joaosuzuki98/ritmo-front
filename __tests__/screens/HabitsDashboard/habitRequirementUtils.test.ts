import { wouldCreateHabitRequirementCycle } from '../../../src/screens/HabitsDashboard/habitRequirementUtils'

describe('wouldCreateHabitRequirementCycle', () => {
    it('detects a direct or transitive cycle', () => {
        const existingEdges = [
            { habitId: 'habit-a', requiredHabitId: 'habit-b' },
            { habitId: 'habit-b', requiredHabitId: 'habit-c' },
        ]

        expect(
            wouldCreateHabitRequirementCycle(
                'habit-c',
                ['habit-a'],
                existingEdges,
            ),
        ).toBe(true)
        expect(
            wouldCreateHabitRequirementCycle(
                'habit-d',
                ['habit-a'],
                existingEdges,
            ),
        ).toBe(false)
    })
})
