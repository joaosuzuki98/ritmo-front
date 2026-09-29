import {
    findEventScheduleConflict,
    findHabitScheduleConflict,
} from '../../../src/utils/scheduleConflict'

const event = (overrides: Record<string, unknown> = {}) => ({
    id: 'event-1',
    title: 'Doctor appointment',
    dateTime: new Date(2026, 5, 8, 9),
    endTime: new Date(2026, 5, 8, 10),
    ...overrides,
})

const habit = (overrides: Record<string, unknown> = {}) => ({
    id: 'habit-1',
    userId: 'user-1',
    name: 'Exercise',
    weekDays: [1],
    preferredTime: new Date(2026, 5, 8, 9),
    estimatedDurationMinutes: 60,
    status: 'pending',
    ...overrides,
})

describe('findEventScheduleConflict', () => {
    it('detects overlap with another event and ignores adjacent time ranges', () => {
        expect(
            findEventScheduleConflict(
                {
                    dateTime: new Date(2026, 5, 8, 9, 30),
                    endTime: new Date(2026, 5, 8, 10, 30),
                },
                [event()],
                [],
            ),
        ).toEqual({ title: 'Doctor appointment', type: 'event' })

        expect(
            findEventScheduleConflict(
                {
                    dateTime: new Date(2026, 5, 8, 10),
                    endTime: new Date(2026, 5, 8, 11),
                },
                [event()],
                [],
            ),
        ).toBeNull()
    })

    it('detects a habit conflict only on its scheduled weekday', () => {
        expect(
            findEventScheduleConflict(
                {
                    dateTime: new Date(2026, 5, 8, 9, 30),
                    endTime: new Date(2026, 5, 8, 10, 30),
                },
                [],
                [habit()],
            ),
        ).toEqual({ title: 'Exercise', type: 'habit' })

        expect(
            findEventScheduleConflict(
                {
                    dateTime: new Date(2026, 5, 9, 9, 30),
                    endTime: new Date(2026, 5, 9, 10, 30),
                },
                [],
                [habit()],
            ),
        ).toBeNull()
    })
})

describe('findHabitScheduleConflict', () => {
    it('detects overlap with another recurring habit on a shared weekday', () => {
        expect(
            findHabitScheduleConflict(
                {
                    userId: 'user-1',
                    weekDays: [1, 3],
                    preferredTime: new Date(2026, 5, 8, 9, 30),
                    estimatedDurationMinutes: 30,
                },
                [habit()],
                [],
            ),
        ).toEqual({ title: 'Exercise', type: 'habit' })
    })

    it('detects upcoming one-off events but ignores past events', () => {
        const candidate = {
            userId: 'user-1',
            weekDays: [1],
            preferredTime: new Date(2026, 5, 8, 9),
            estimatedDurationMinutes: 60,
        }
        const now = new Date(2026, 5, 1)

        expect(
            findHabitScheduleConflict(
                candidate,
                [],
                [event({ dateTime: new Date(2026, 5, 8, 9) })],
                now,
            ),
        ).toEqual({ title: 'Doctor appointment', type: 'event' })

        expect(
            findHabitScheduleConflict(
                candidate,
                [],
                [event({ dateTime: new Date(2026, 4, 25, 9) })],
                now,
            ),
        ).toBeNull()
    })

    it('does not treat paused habits as occupied schedule time', () => {
        expect(
            findHabitScheduleConflict(
                {
                    userId: 'user-1',
                    weekDays: [1],
                    preferredTime: new Date(2026, 5, 8, 9, 30),
                },
                [habit({ status: 'paused' })],
                [],
            ),
        ).toBeNull()
    })
})
