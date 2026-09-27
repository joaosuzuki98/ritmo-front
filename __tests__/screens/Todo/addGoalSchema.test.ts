import { addGoalSchema } from '../../../src/screens/Todo/addGoalSchema'

const goalForm = {
    goalType: 'habit',
    habitId: 'habit-1',
    includedHabitIds: [],
    term: 'short',
    description: 'Read consistently',
    targetValue: '12',
    targetPercentage: '80',
}

describe('addGoalSchema', () => {
    it('accepts an individual habit goal', () => {
        expect(addGoalSchema.safeParse(goalForm).success).toBe(true)
    })

    it('requires at least two habits for group goals', () => {
        expect(
            addGoalSchema.safeParse({
                ...goalForm,
                goalType: 'group',
                habitId: '',
                includedHabitIds: ['habit-1'],
            }).success,
        ).toBe(false)
        expect(
            addGoalSchema.safeParse({
                ...goalForm,
                goalType: 'group',
                habitId: '',
                includedHabitIds: ['habit-1', 'habit-2'],
            }).success,
        ).toBe(true)
    })

    it('restricts the consistency target to percentages from 1 to 100', () => {
        expect(
            addGoalSchema.safeParse({
                ...goalForm,
                goalType: 'group',
                includedHabitIds: ['habit-1', 'habit-2'],
                targetPercentage: '101',
            }).success,
        ).toBe(false)
    })
})
