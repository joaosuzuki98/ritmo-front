export type ScheduleHabit = {
    id: string
    title: string
    description: string
}

export type ScheduleEntry = {
    id: string
    title: string
    startHour: number
    endHour: number
    isEvent?: boolean
    eventId?: string
    habitId?: string
}
