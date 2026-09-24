import { useEffect, useMemo, useState } from 'react'

import type { ScheduleEntry, ScheduleHabit } from './schedule.types'

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

const availableHabits: ScheduleHabit[] = [
    {
        description: 'Build a calm start to the day.',
        id: 'morning-stretch',
        title: 'Morning stretch',
    },
    {
        description: 'Read a few pages without distractions.',
        id: 'read-book',
        title: 'Read for 20 minutes',
    },
    {
        description: 'Keep your energy steady throughout the day.',
        id: 'drink-water',
        title: 'Drink water',
    },
    {
        description: 'Close the day with a clear next step.',
        id: 'plan-tomorrow',
        title: 'Plan tomorrow',
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
    const period = normalizedHour < 12 ? 'AM' : 'PM'
    return `${String(displayHour).padStart(2, '0')}:00 ${period}`
}

export const useScheduleViewModel = () => {
    const today = startOfDay(new Date())
    const [selectedDate, setSelectedDate] = useState(today)
    const [calendarMonth, setCalendarMonth] = useState(
        new Date(today.getFullYear(), today.getMonth(), 1),
    )
    const [linkedHabits, setLinkedHabits] = useState<
        Record<string, Array<{ habitId: string; startHour: number }>>
    >({})

    useEffect(() => {
        setCalendarMonth(
            new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
        )
    }, [selectedDate])

    const entries = useMemo(() => {
        const dayLinks = linkedHabits[dateKey(selectedDate)] ?? []
        const linkedEntries = dayLinks.flatMap(link => {
            const habit = availableHabits.find(item => item.id === link.habitId)
            if (!habit) return []
            return [
                {
                    endHour: link.startHour + 1,
                    habitId: habit.id,
                    id: `habit-${habit.id}-${link.startHour}`,
                    startHour: link.startHour,
                    title: habit.title,
                },
            ]
        })
        return [...baseEntries, ...linkedEntries].sort(
            (left, right) => left.startHour - right.startHour,
        )
    }, [linkedHabits, selectedDate])

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

    const linkHabit = (habitId: string, startHour: number) => {
        const key = dateKey(selectedDate)
        setLinkedHabits(current => {
            const currentDayLinks = current[key] ?? []
            const nextDayLinks = currentDayLinks.filter(
                link => link.startHour !== startHour,
            )
            return {
                ...current,
                [key]: [...nextDayLinks, { habitId, startHour }],
            }
        })
    }

    return {
        availableHabits,
        calendarMonth,
        entries,
        formatScheduleDate,
        formatMonthLabel,
        getCalendarDays,
        getHourLabel,
        linkHabit,
        moveCalendarMonth,
        moveDate,
        selectDate,
        selectedDate,
    }
}
