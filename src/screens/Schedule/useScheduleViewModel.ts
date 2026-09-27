import { Q } from '@nozbe/watermelondb'
import { useEffect, useMemo, useState } from 'react'

import { database, type Event, type Habit } from '../../database'
import type { AddScheduleItemFormData } from './addScheduleItemSchema'
import {
    getEventScheduleEntries,
    getHabitScheduleEntries,
} from './schedule.utils'
import { findEventScheduleConflict } from '../../utils/scheduleConflict'
import { getScheduleDateTime } from './scheduleTime'

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

const getScheduleConflictError = (title: string): Error =>
    new Error(`This time overlaps with “${title}”.`)

export const useScheduleViewModel = (currentUserId: string) => {
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
            .query(Q.where('user_id', currentUserId))
            .observeWithColumns([
                'name',
                'status',
                'preferred_time',
                'estimated_duration_minutes',
                'week_days',
            ])
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
    }, [currentUserId])

    useEffect(() => {
        let isActive = true
        const subscription = database
            .get<Event>('events')
            .query(Q.where('user_id', currentUserId))
            .observeWithColumns([
                'title',
                'date_time',
                'end_time',
                'location',
                'description',
            ])
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
    }, [currentUserId])

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
        endHour,
        endPeriod,
        location,
        description,
        startHour,
        startPeriod,
        title,
    }: AddScheduleItemFormData) => {
        const dateTime = getScheduleDateTime(
            selectedDate,
            startHour,
            startPeriod,
        )
        const scheduledEndTime = getScheduleDateTime(
            selectedDate,
            endHour,
            endPeriod,
        )
        const [existingEvents, existingHabits] = await Promise.all([
            database
                .get<Event>('events')
                .query(Q.where('user_id', currentUserId))
                .fetch(),
            database
                .get<Habit>('habits')
                .query(Q.where('user_id', currentUserId))
                .fetch(),
        ])
        const conflict = findEventScheduleConflict(
            { dateTime, endTime: scheduledEndTime },
            existingEvents,
            existingHabits,
        )
        if (conflict) throw getScheduleConflictError(conflict.title)

        await database.write(async () => {
            await database.get<Event>('events').create(event => {
                event.userId = currentUserId
                event.title = title.trim()
                event.dateTime = dateTime
                event.endTime = scheduledEndTime
                event.location = location?.trim() || undefined
                event.description = description?.trim() || undefined
                event.recurrence = 'none'
                event.countdownEnabled = false
                event.conversionOrigin = 'schedule'
            })
        })
    }

    const updateScheduleItem = async (
        eventId: string,
        {
            endHour,
            endPeriod,
            location,
            description,
            startHour,
            startPeriod,
            title,
        }: AddScheduleItemFormData,
    ) => {
        const event = await database.get<Event>('events').find(eventId)
        if (event.userId !== currentUserId) return
        const dateTime = getScheduleDateTime(
            selectedDate,
            startHour,
            startPeriod,
        )
        const scheduledEndTime = getScheduleDateTime(
            selectedDate,
            endHour,
            endPeriod,
        )
        const [existingEvents, existingHabits] = await Promise.all([
            database
                .get<Event>('events')
                .query(Q.where('user_id', currentUserId))
                .fetch(),
            database
                .get<Habit>('habits')
                .query(Q.where('user_id', currentUserId))
                .fetch(),
        ])
        const conflict = findEventScheduleConflict(
            { id: eventId, dateTime, endTime: scheduledEndTime },
            existingEvents,
            existingHabits,
        )
        if (conflict) throw getScheduleConflictError(conflict.title)

        await database.write(async () => {
            await event.update(record => {
                record.title = title.trim()
                record.dateTime = dateTime
                record.endTime = scheduledEndTime
                record.location = location?.trim() || undefined
                record.description = description?.trim() || undefined
                record.updatedAt = new Date()
            })
        })
    }

    const deleteScheduleItem = async (eventId: string) => {
        const event = await database.get<Event>('events').find(eventId)
        if (event.userId !== currentUserId) return
        await database.write(async () => event.markAsDeleted())
    }

    return {
        calendarMonth,
        entries,
        formatScheduleDate,
        formatMonthLabel,
        getCalendarDays,
        getHourLabel,
        addScheduleItem,
        deleteScheduleItem,
        moveCalendarMonth,
        moveDate,
        parseScheduleHour,
        selectDate,
        selectedDate,
        updateScheduleItem,
        events,
    }
}
