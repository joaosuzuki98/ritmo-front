import { Q } from '@nozbe/watermelondb'
import { useEffect, useMemo, useState } from 'react'

import { database, type Event, type Habit } from '../../database'
import type { AddScheduleItemFormData } from '../Schedule/addScheduleItemSchema'
import { findEventScheduleConflict } from '../../utils/scheduleConflict'
import { getScheduleDateTime } from '../Schedule/scheduleTime'

const startOfDay = (date: Date): Date => {
    const value = new Date(date)
    value.setHours(0, 0, 0, 0)
    return value
}

export const useRemindersViewModel = (currentUserId: string) => {
    const [events, setEvents] = useState<Event[]>([])
    const [visibleMonth, setVisibleMonth] = useState(() => {
        const today = new Date()
        return new Date(today.getFullYear(), today.getMonth(), 1)
    })
    const [selectedDate, setSelectedDate] = useState(() =>
        startOfDay(new Date()),
    )
    useEffect(() => {
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
                next: setEvents,
                error: () => setEvents([]),
            })

        return () => subscription.unsubscribe()
    }, [currentUserId])

    const calendarDays = useMemo(() => {
        const firstWeekday = new Date(
            visibleMonth.getFullYear(),
            visibleMonth.getMonth(),
            1,
        ).getDay()
        const daysInMonth = new Date(
            visibleMonth.getFullYear(),
            visibleMonth.getMonth() + 1,
            0,
        ).getDate()
        const days: Array<number | null> = Array.from(
            { length: firstWeekday },
            () => null,
        )

        for (let day = 1; day <= daysInMonth; day += 1) days.push(day)
        while (days.length % 7 !== 0) days.push(null)
        return days
    }, [visibleMonth])

    const eventsForSelectedDate = events.filter(event => {
        const date = event.dateTime
        return (
            date.getFullYear() === selectedDate.getFullYear() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getDate() === selectedDate.getDate()
        )
    })

    const moveMonth = (delta: number) => {
        setVisibleMonth(
            current =>
                new Date(current.getFullYear(), current.getMonth() + delta, 1),
        )
    }

    const selectDay = (day: number) => {
        setSelectedDate(
            new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day),
        )
    }

    const selectMonth = (month: Date) => {
        setVisibleMonth(new Date(month.getFullYear(), month.getMonth(), 1))
        setSelectedDate(new Date(month.getFullYear(), month.getMonth(), 1))
    }

    const addEvent = async (data: AddScheduleItemFormData) => {
        const dateTime = getScheduleDateTime(
            selectedDate,
            data.startHour,
            data.startPeriod,
        )
        const endTime = getScheduleDateTime(
            selectedDate,
            data.endHour,
            data.endPeriod,
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
            { dateTime, endTime },
            existingEvents,
            existingHabits,
        )
        if (conflict)
            throw new Error(`This time overlaps with “${conflict.title}”.`)

        await database.write(async () => {
            await database.get<Event>('events').create(event => {
                event.userId = currentUserId
                event.title = data.title.trim()
                event.dateTime = dateTime
                event.endTime = endTime
                event.location = data.location?.trim() || undefined
                event.description = data.description?.trim() || undefined
                event.recurrence = 'none'
                event.countdownEnabled = false
                event.conversionOrigin = 'reminders'
            })
        })
    }

    const updateEvent = async (
        eventId: string,
        data: AddScheduleItemFormData,
    ) => {
        const event = await database.get<Event>('events').find(eventId)
        if (event.userId !== currentUserId) return
        const dateTime = getScheduleDateTime(
            selectedDate,
            data.startHour,
            data.startPeriod,
        )
        const endTime = getScheduleDateTime(
            selectedDate,
            data.endHour,
            data.endPeriod,
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
            { id: eventId, dateTime, endTime },
            existingEvents,
            existingHabits,
        )
        if (conflict)
            throw new Error(`This time overlaps with “${conflict.title}”.`)

        await database.write(async () => {
            await event.update(record => {
                record.title = data.title.trim()
                record.dateTime = dateTime
                record.endTime = endTime
                record.location = data.location?.trim() || undefined
                record.description = data.description?.trim() || undefined
                record.updatedAt = new Date()
            })
        })
    }

    const deleteEvent = async (eventId: string) => {
        const event = await database.get<Event>('events').find(eventId)
        if (event.userId !== currentUserId) return
        await database.write(async () => event.markAsDeleted())
    }

    return {
        addEvent,
        updateEvent,
        deleteEvent,
        calendarDays,
        eventsForSelectedDate,
        events,
        moveMonth,
        selectMonth,
        selectDay,
        selectedDate,
        visibleMonth,
    }
}
