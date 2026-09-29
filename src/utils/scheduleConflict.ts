type ScheduledEvent = {
    id: string
    title: string
    dateTime: Date
    endTime?: Date
}

type ScheduledHabit = {
    id: string
    userId: string
    name: string
    weekDays: number[]
    preferredTime?: Date
    estimatedDurationMinutes?: number
    status: string
}

export type ScheduleConflict = {
    title: string
    type: 'event' | 'habit'
}

type EventCandidate = {
    id?: string
    dateTime: Date
    endTime?: Date
}

type HabitCandidate = {
    id?: string
    userId: string
    weekDays: readonly number[]
    preferredTime?: Date
    estimatedDurationMinutes?: number
}

const getEventInterval = (event: EventCandidate): [number, number] => {
    const start = event.dateTime.getTime()
    const storedEnd = event.endTime?.getTime()
    const end = storedEnd && storedEnd > start ? storedEnd : start + 60 * 60_000
    return [start, end]
}

const getHabitTimeInterval = (
    habit: Pick<HabitCandidate, 'preferredTime' | 'estimatedDurationMinutes'>,
): [number, number] | null => {
    if (!habit.preferredTime) return null

    const start =
        habit.preferredTime.getHours() * 60 + habit.preferredTime.getMinutes()
    const duration = Math.max(1, habit.estimatedDurationMinutes ?? 60)
    return [start, start + duration]
}

const getHabitInterval = (
    date: Date,
    habit: Pick<HabitCandidate, 'preferredTime' | 'estimatedDurationMinutes'>,
): [number, number] | null => {
    const interval = getHabitTimeInterval(habit)
    if (!interval) return null

    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    return interval.map(minutes => startOfDay.getTime() + minutes * 60_000) as [
        number,
        number,
    ]
}

const intervalsOverlap = (
    [leftStart, leftEnd]: [number, number],
    [rightStart, rightEnd]: [number, number],
): boolean => leftStart < rightEnd && rightStart < leftEnd

const getWeekDay = (date: Date): number => date.getDay() || 7

export const findEventScheduleConflict = (
    candidate: EventCandidate,
    events: readonly ScheduledEvent[],
    habits: readonly ScheduledHabit[],
): ScheduleConflict | null => {
    const candidateInterval = getEventInterval(candidate)
    const overlappingEvent = events.find(
        event =>
            event.id !== candidate.id &&
            intervalsOverlap(candidateInterval, getEventInterval(event)),
    )
    if (overlappingEvent)
        return { title: overlappingEvent.title, type: 'event' }

    const weekDay = getWeekDay(candidate.dateTime)
    const overlappingHabit = habits.find(habit => {
        if (habit.status === 'paused' || !habit.weekDays.includes(weekDay))
            return false
        const interval = getHabitInterval(candidate.dateTime, habit)
        return (
            interval !== null && intervalsOverlap(candidateInterval, interval)
        )
    })

    return overlappingHabit
        ? { title: overlappingHabit.name, type: 'habit' }
        : null
}

export const findHabitScheduleConflict = (
    candidate: HabitCandidate,
    habits: readonly ScheduledHabit[],
    events: readonly ScheduledEvent[],
    now = new Date(),
): ScheduleConflict | null => {
    if (!candidate.preferredTime) return null

    const scheduledWeekDays = new Set(candidate.weekDays)
    const overlappingHabit = habits.find(habit => {
        if (
            habit.id === candidate.id ||
            habit.userId !== candidate.userId ||
            habit.status === 'paused' ||
            !habit.preferredTime ||
            !habit.weekDays.some(day => scheduledWeekDays.has(day))
        )
            return false

        const sharedWeekDay = habit.weekDays.find(day =>
            scheduledWeekDays.has(day),
        )
        if (sharedWeekDay === undefined) return false

        const candidateInterval = getHabitTimeInterval(candidate)
        const existingInterval = getHabitTimeInterval(habit)
        return (
            candidateInterval !== null &&
            existingInterval !== null &&
            intervalsOverlap(candidateInterval, existingInterval)
        )
    })
    if (overlappingHabit) return { title: overlappingHabit.name, type: 'habit' }

    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    const overlappingEvent = events.find(event => {
        if (
            event.dateTime < today ||
            !scheduledWeekDays.has(getWeekDay(event.dateTime))
        )
            return false

        const candidateInterval = getHabitInterval(event.dateTime, candidate)
        return (
            candidateInterval !== null &&
            intervalsOverlap(candidateInterval, getEventInterval(event))
        )
    })

    return overlappingEvent
        ? { title: overlappingEvent.title, type: 'event' }
        : null
}
