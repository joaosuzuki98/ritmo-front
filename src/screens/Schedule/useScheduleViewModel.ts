import { useEffect, useMemo, useState } from 'react'

import { database, type Event, type Habit } from '../../database'
import type { AddScheduleItemFormData } from './addScheduleItemSchema'
import {
    getEventScheduleEntries,
    getHabitScheduleEntries,
} from './schedule.utils'

const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
]

const startOfDay = (date: Date): Date => {
    const normalized = new Date(date)
    normalized.setHours(0, 0, 0, 0)
    return normalized
}

export const dateKey = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

export const formatScheduleDate = (date: Date): string =>
    `${date.getDate()} ${monthNames[date.getMonth()]}`

export const formatMonthLabel = (date: Date): string =>
    `${monthNames[date.getMonth()]} ${date.getFullYear()}`

export const getCalendarDays = (month: Date): Array<Date | null> => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
    const daysInMonth = new Date(
        month.getFullYear(),
        month.getMonth() + 1,
        0,
    ).getDate()
    const days: Array<Date | null> = Array.from(
        { length: firstDay.getDay() },
        () => null,
    )

    for (let day = 1; day <= daysInMonth; day += 1) {
        days.push(new Date(month.getFullYear(), month.getMonth(), day))
    }

    return days
}

export const getHourLabel = (hour: number): string => {
    const normalizedHour = hour % 24
    const displayHour = normalizedHour % 12 || 12
    const minutes = Math.round(
        (normalizedHour - Math.floor(normalizedHour)) * 60,
    )
    const label = `${String(displayHour).padStart(2, '0')}:${String(
        minutes,
    ).padStart(2, '0')}`

    if (normalizedHour === 0) return `AM\n${label}`
    if (normalizedHour === 12) return `PM\n${label}`
    return `${label} ${normalizedHour < 12 ? 'AM' : 'PM'}`
}

export const parseScheduleHour = (time: string): number =>
    Number(time.slice(0, 2))

const getScheduleDateTime = (date: Date, time: string): Date => {
    const [hours, minutes] = time.split(':').map(Number)
    const dateTime = new Date(date)
    dateTime.setHours(hours, minutes, 0, 0)
    return dateTime
}

export const useScheduleViewModel = () => {
    const today = startOfDay(new Date())
    const [selectedDate, setSelectedDate] = useState(today)
    const [calendarMonth, setCalendarMonth] = useState(
        new Date(today.getFullYear(), today.getMonth(), 1),
    )
    const [habits, setHabits] = useState<Habit[]>([])
    const [events, setEvents] = useState<Event[]>([])

    useEffect(() => {
        setCalendarMonth(
            new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
        )
    }, [selectedDate])

    useEffect(() => {
        let isActive = true
        const subscription = database
            .get<Habit>('habits')
            .query()
            .observe()
            .subscribe({
                next: records => {
                    if (isActive) setHabits(records)
                },
                error: () => {
                    if (isActive) setHabits([])
                },
            })

        return () => {
            isActive = false
            subscription.unsubscribe()
        }
    }, [])

    useEffect(() => {
        let isActive = true
        const subscription = database
            .get<Event>('events')
            .query()
            .observe()
            .subscribe({
                next: records => {
                    if (isActive) setEvents(records)
                },
                error: () => {
                    if (isActive) setEvents([])
                },
            })

        return () => {
            isActive = false
            subscription.unsubscribe()
        }
    }, [])

    const entries = useMemo(() => {
        const eventEntries = getEventScheduleEntries(events, selectedDate)
        const linkedEntries = getHabitScheduleEntries(habits, selectedDate)
        return [...eventEntries, ...linkedEntries].sort(
            (left, right) => left.startHour - right.startHour,
        )
    }, [events, habits, selectedDate])

    const moveDate = (delta: number) => {
        setSelectedDate(current => {
            const nextDate = new Date(current)
            nextDate.setDate(nextDate.getDate() + delta)
            return nextDate
        })
    }

    const selectDate = (date: Date) => {
        setSelectedDate(startOfDay(date))
    }

    const moveCalendarMonth = (delta: number) => {
        setCalendarMonth(
            current =>
                new Date(current.getFullYear(), current.getMonth() + delta, 1),
        )
    }

    const addScheduleItem = async ({
        endTime,
        startTime,
        title,
    }: AddScheduleItemFormData) => {
        const dateTime = getScheduleDateTime(selectedDate, startTime)
        const scheduledEndTime = getScheduleDateTime(selectedDate, endTime)

        await database.write(async () => {
            await database.get<Event>('events').create(event => {
                event.userId = 'local-user'
                event.title = title.trim()
                event.dateTime = dateTime
                event.endTime = scheduledEndTime
                event.recurrence = 'none'
                event.countdownEnabled = false
                event.conversionOrigin = 'schedule'
            })
        })
    }

    return {
        calendarMonth,
        entries,
        formatScheduleDate,
        formatMonthLabel,
        getCalendarDays,
        getHourLabel,
        addScheduleItem,
        moveCalendarMonth,
        moveDate,
        parseScheduleHour,
        selectDate,
        selectedDate,
    }
}
