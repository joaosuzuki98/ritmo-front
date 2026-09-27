import {
    getEventScheduleEntries,
    getHabitScheduleEntries,
} from '../../../src/screens/Schedule/schedule.utils'

describe('getEventScheduleEntries', () => {
    it('includes events for the selected local day with their scheduled hour', () => {
        const entries = getEventScheduleEntries(
            [
                {
                    id: 'today-event',
                    title: 'Team meeting',
                    dateTime: new Date(2026, 8, 25, 14, 30),
                    endTime: new Date(2026, 8, 25, 16, 15),
                },
                {
                    id: 'one-hour-event',
                    title: 'Check-in',
                    dateTime: new Date(2026, 8, 25, 18),
                },
                {
                    id: 'tomorrow-event',
                    title: 'Dentist',
                    dateTime: new Date(2026, 8, 26, 9),
                },
            ],
            new Date(2026, 8, 25),
        )

        expect(entries).toEqual([
            {
                id: 'event-today-event',
                title: 'Team meeting',
                startHour: 14.5,
                endHour: 16.25,
                isEvent: true,
            },
            {
                id: 'event-one-hour-event',
                title: 'Check-in',
                startHour: 18,
                endHour: 19,
                isEvent: true,
            },
        ])
    })
})

describe('getHabitScheduleEntries', () => {
    it('uses the habit time, duration, and weekday without rounding to hours', () => {
        const entries = getHabitScheduleEntries(
            [
                {
                    id: 'stretch',
                    name: 'Stretch',
                    status: 'pending',
                    preferredTime: new Date(2026, 8, 21, 10, 30),
                    estimatedDurationMinutes: 120,
                    weekDays: [1],
                },
                {
                    id: 'paused',
                    name: 'Paused habit',
                    status: 'paused',
                    preferredTime: new Date(2026, 8, 21, 11),
                    estimatedDurationMinutes: 60,
                    weekDays: [1],
                },
            ],
            new Date(2026, 8, 21),
        )

        expect(entries).toEqual([
            {
                id: 'habit-stretch-10.5',
                title: 'Stretch',
                habitId: 'stretch',
                startHour: 10.5,
                endHour: 12.5,
            },
        ])
    })
})
