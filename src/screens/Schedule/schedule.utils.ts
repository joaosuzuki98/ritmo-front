import type { ScheduleEntry } from './schedule.types'

type ScheduledEventSource = {
    id: string
    title: string
    dateTime: Date
}

export const getEventScheduleEntries = (
    events: readonly ScheduledEventSource[],
    selectedDate: Date,
): ScheduleEntry[] =>
    events.flatMap(event => {
        const eventDate = event.dateTime
        if (
            eventDate.getFullYear() !== selectedDate.getFullYear() ||
            eventDate.getMonth() !== selectedDate.getMonth() ||
            eventDate.getDate() !== selectedDate.getDate()
        )
            return []

        const startHour = eventDate.getHours()
        return [
            {
                endHour: startHour + 1,
                id: `event-${event.id}`,
                isEvent: true,
                startHour,
                title: event.title,
            },
        ]
    })
