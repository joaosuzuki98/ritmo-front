import { getEventScheduleEntries } from '../../../src/screens/Schedule/schedule.utils'

describe('getEventScheduleEntries', () => {
    it('includes events for the selected local day with their scheduled hour', () => {
        const entries = getEventScheduleEntries(
            [
                {
                    id: 'today-event',
                    title: 'Team meeting',
                    dateTime: new Date(2026, 8, 25, 14, 30),
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
                startHour: 14,
                endHour: 15,
                isEvent: true,
            },
        ])
    })
})
