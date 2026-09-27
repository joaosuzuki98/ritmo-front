import { addHabitSchema } from '../../../src/screens/HabitsDashboard/addHabitSchema'

const habitForm = {
    name: 'Stretch',
    description: '',
    categoryName: '',
    frequencyType: 'daily',
    weekDays: [1, 2, 3, 4, 5, 6, 7],
    priority: 'medium',
    estimatedDurationMinutes: '',
    preferredTime: '',
    isFocusOfDay: false,
    dependencyHabitId: '',
    conditionHabitId: '',
    conditionStatus: '',
}

describe('addHabitSchema requirements', () => {
    it('accepts a chain prerequisite', () => {
        expect(
            addHabitSchema.safeParse({
                ...habitForm,
                dependencyHabitId: 'habit-1',
            }).success,
        ).toBe(true)
    })

    it('requires a condition status and rejects duplicate requirement habits', () => {
        expect(
            addHabitSchema.safeParse({
                ...habitForm,
                conditionHabitId: 'habit-1',
            }).success,
        ).toBe(false)
        expect(
            addHabitSchema.safeParse({
                ...habitForm,
                dependencyHabitId: 'habit-1',
                conditionHabitId: 'habit-1',
                conditionStatus: 'completed',
            }).success,
        ).toBe(false)
    })
})
