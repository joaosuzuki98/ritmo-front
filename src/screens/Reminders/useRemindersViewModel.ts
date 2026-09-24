import { useEffect, useMemo, useState } from 'react'

import { database, type Event } from '../../database'
import type { AddScheduleItemFormData } from '../Schedule/addScheduleItemSchema'

const startOfDay = (date: Date): Date => {
    const value = new Date(date)
    value.setHours(0, 0, 0, 0)
    return value
}

export const useRemindersViewModel = () => {
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
            .query()
            .observe()
            .subscribe({
                next: setEvents,
                error: () => setEvents([]),
            })

        return () => subscription.unsubscribe()
    }, [])

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
        const dateTime = new Date(selectedDate)
        dateTime.setHours(Number(data.startTime.slice(0, 2)), 0, 0, 0)

        await database.write(async () => {
            await database.get<Event>('events').create(event => {
                event.userId = 'local-user'
                event.title = data.title.trim()
                event.dateTime = dateTime
                event.recurrence = 'none'
                event.countdownEnabled = false
                event.conversionOrigin = 'reminders'
            })
        })
    }

    return {
        addEvent,
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
