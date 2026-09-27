import type { ScheduleEntry } from './schedule.types'

type ScheduledEventSource = {
    id: string
    title: string
    dateTime: Date
    endTime?: Date
}

type ScheduledHabitSource = {
    id: string
    name: string
    status: string
    preferredTime?: Date
    estimatedDurationMinutes?: number
    weekDays: number[]
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

        const startHour = eventDate.getHours() + eventDate.getMinutes() / 60
        const storedEndHour = event.endTime
            ? event.endTime.getHours() + event.endTime.getMinutes() / 60
            : startHour + 1
        return [
            {
                endHour:
                    storedEndHour > startHour ? storedEndHour : startHour + 1,
                id: `event-${event.id}`,
                isEvent: true,
                startHour,
                title: event.title,
            },
        ]
    })

export const getHabitScheduleEntries = (
    habits: readonly ScheduledHabitSource[],
    selectedDate: Date,
): ScheduleEntry[] => {
    const weekDay = selectedDate.getDay() || 7

    return habits.flatMap(habit => {
        if (
            habit.status === 'paused' ||
            !habit.preferredTime ||
            !habit.weekDays.includes(weekDay)
        )
            return []

        const startHour =
            habit.preferredTime.getHours() +
            habit.preferredTime.getMinutes() / 60
        const durationHours = (habit.estimatedDurationMinutes ?? 60) / 60

        return [
            {
                endHour: startHour + Math.max(1 / 60, durationHours),
                habitId: habit.id,
                id: `habit-${habit.id}-${startHour}`,
                startHour,
                title: habit.name,
            },
        ]
    })
}
