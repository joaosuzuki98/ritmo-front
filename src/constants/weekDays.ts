export const weekDays = [1, 2, 3, 4, 5, 6, 7] as const

export type WeekDay = (typeof weekDays)[number]

export const weekDayLabels: Record<WeekDay, string> = {
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
    7: 'Sunday',
}

export const clampWeekDay = (value: number): WeekDay => {
    return Math.min(7, Math.max(1, Math.round(value))) as WeekDay
}

export const cycleWeekDay = (value: number): WeekDay => {
    const normalized = Math.round(value) - 1
    return ((((normalized % weekDays.length) + weekDays.length) %
        weekDays.length) +
        1) as WeekDay
}
