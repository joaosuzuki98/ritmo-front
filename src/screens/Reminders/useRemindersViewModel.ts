import { Q } from '@nozbe/watermelondb'
import { useEffect, useMemo, useState } from 'react'

import { database, type Event } from '../../database'
import type { AddScheduleItemFormData } from '../Schedule/addScheduleItemSchema'
import { getScheduleDateTime } from '../Schedule/scheduleTime'
import { createEventLocally, updateEventLocally } from './eventPersistence'

const startOfDay = (date: Date): Date => {
    const value = new Date(date)
    value.setHours(0, 0, 0, 0)
    return value
}

export type ReminderType = NonNullable<AddScheduleItemFormData['reminderType']>

export const getReminderType = (
    reminderType: string | undefined,
): ReminderType =>
    reminderType === 'holiday' || reminderType === 'important_day'
        ? reminderType
        : 'normal'

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
            .query(
                Q.where('user_id', currentUserId),
                Q.where('conversion_origin', 'reminders'),
            )
            .observeWithColumns([
                'title',
                'date_time',
                'end_time',
                'location',
                'description',
                'conversion_origin',
                'reminder_type',
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

    const selectedDateEvents = events.filter(event => {
        const date = event.dateTime
        return (
            date.getFullYear() === selectedDate.getFullYear() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getDate() === selectedDate.getDate()
        )
    })
    const eventsForSelectedDate = selectedDateEvents.filter(
        event => getReminderType(event.reminderType) === 'normal',
    )
    const holidaysForSelectedDate = selectedDateEvents.filter(
        event => getReminderType(event.reminderType) === 'holiday',
    )
    const importantDaysForSelectedDate = selectedDateEvents.filter(
        event => getReminderType(event.reminderType) === 'important_day',
    )

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
            data.startMinute,
        )
        const endTime = getScheduleDateTime(
            selectedDate,
            data.endHour,
            data.endPeriod,
            data.endMinute,
        )
        await createEventLocally(currentUserId, {
            title: data.title,
            dateTime,
            endTime,
            location: data.location,
            description: data.description,
            reminderType: data.reminderType,
        })
    }

    const updateEvent = async (
        eventId: string,
        data: AddScheduleItemFormData,
    ) => {
        const dateTime = getScheduleDateTime(
            selectedDate,
            data.startHour,
            data.startPeriod,
            data.startMinute,
        )
        const endTime = getScheduleDateTime(
            selectedDate,
            data.endHour,
            data.endPeriod,
            data.endMinute,
        )
        await updateEventLocally(currentUserId, eventId, {
            title: data.title,
            dateTime,
            endTime,
            location: data.location,
            description: data.description,
            reminderType: data.reminderType ?? 'normal',
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
        holidaysForSelectedDate,
        importantDaysForSelectedDate,
        events,
        moveMonth,
        selectMonth,
        selectDay,
        selectedDate,
        visibleMonth,
    }
}
