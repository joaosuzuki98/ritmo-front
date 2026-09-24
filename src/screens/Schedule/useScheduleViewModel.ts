import { useEffect, useMemo, useState } from 'react'

import { database, type Habit } from '../../database'
import type { AddScheduleItemFormData } from './addScheduleItemSchema'
import type { ScheduleEntry } from './schedule.types'

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

const baseEntries: ScheduleEntry[] = [
    {
        endHour: 8,
        id: 'wake-up',
        isCurrent: true,
        startHour: 6,
        title: 'Wake up and brush\nmy teeth',
    },
    {
        endHour: 13,
        id: 'work',
        startHour: 11,
        title: 'Work',
    },
    {
        endHour: 16,
        id: 'clean-house',
        startHour: 15,
        title: 'Clean my house',
    },
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
    const label = `${String(displayHour).padStart(2, '0')}:00`

    if (normalizedHour === 0) return `AM\n${label}`
    if (normalizedHour === 12) return `PM\n${label}`
    return label
}

export const parseScheduleHour = (time: string): number =>
    Number(time.slice(0, 2))

export const useScheduleViewModel = () => {
    const today = startOfDay(new Date())
    const [selectedDate, setSelectedDate] = useState(today)
    const [calendarMonth, setCalendarMonth] = useState(
        new Date(today.getFullYear(), today.getMonth(), 1),
    )
    const [habits, setHabits] = useState<Habit[]>([])
    const [manualItems, setManualItems] = useState<
        Record<string, ScheduleEntry[]>
    >({})

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

    const entries = useMemo(() => {
        const weekDay = selectedDate.getDay() || 7
        const linkedEntries = habits.flatMap(habit => {
            if (
                habit.status === 'paused' ||
                !habit.preferredTime ||
                !habit.weekDays.includes(weekDay)
            )
                return []
            const startHour = habit.preferredTime.getHours()
            return [
                {
                    endHour:
                        startHour +
                        Math.max(
                            1,
                            Math.ceil(
                                (habit.estimatedDurationMinutes ?? 60) / 60,
                            ),
                        ),
                    habitId: habit.id,
                    id: `habit-${habit.id}-${startHour}`,
                    startHour,
                    title: habit.name,
                },
            ]
        })
        return [
            ...baseEntries,
            ...(manualItems[dateKey(selectedDate)] ?? []),
            ...linkedEntries,
        ].sort((left, right) => left.startHour - right.startHour)
    }, [habits, manualItems, selectedDate])

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

    const addScheduleItem = ({
        endTime,
        startTime,
        title,
    }: AddScheduleItemFormData) => {
        const key = dateKey(selectedDate)
        const startHour = parseScheduleHour(startTime)
        const endHour = parseScheduleHour(endTime)
        const item: ScheduleEntry = {
            endHour,
            id: `manual-${Date.now()}`,
            isManual: true,
            startHour,
            title: title.trim(),
        }
        setManualItems(current => ({
            ...current,
            [key]: [...(current[key] ?? []), item],
        }))
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
