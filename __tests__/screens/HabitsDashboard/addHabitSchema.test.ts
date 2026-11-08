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

describe('addHabitSchema preferred time', () => {
    it.each(['00:00', '09:35', '23:55'])('accepts time %s', time => {
        expect(
            addHabitSchema.safeParse({
                ...habitForm,
                preferredTime: time,
            }).success,
        ).toBe(true)
    })

    it.each(['24:00', '09:60', '09:00 AM', '-1'])('rejects time %s', time => {
        expect(
            addHabitSchema.safeParse({
                ...habitForm,
                preferredTime: time,
            }).success,
        ).toBe(false)
    })
})

describe('addHabitSchema duration', () => {
    it.each(['5', '60', '1440'])('accepts %s minutes', duration => {
        expect(
            addHabitSchema.safeParse({
                ...habitForm,
                estimatedDurationMinutes: duration,
            }).success,
        ).toBe(true)
    })

    it.each(['1', '1445'])('rejects %s minutes', duration => {
        expect(
            addHabitSchema.safeParse({
                ...habitForm,
                estimatedDurationMinutes: duration,
            }).success,
        ).toBe(false)
    })
})
