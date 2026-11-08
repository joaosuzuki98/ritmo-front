export type ScheduleTimePeriod = 'AM' | 'PM'

export type ScheduleTimeParts = {
    hour: string
    period: ScheduleTimePeriod
}

export const getScheduleTimeParts = (hour: number): ScheduleTimeParts => ({
    hour: String(hour === 0 ? 0 : hour % 12 || 12).padStart(2, '0'),
    period: hour < 12 ? 'AM' : 'PM',
})

export const getScheduleHour = (
    hour: string,
    period: ScheduleTimePeriod,
): number => (Number(hour) % 12) + (period === 'PM' ? 12 : 0)

export const getScheduleMinuteParts = (minute: number): string =>
    String(minute).padStart(2, '0')

export const getScheduleDateTime = (
    date: Date,
    hour: string,
    period: ScheduleTimePeriod,
    minute = '00',
): Date => {
    const dateTime = new Date(date)
    dateTime.setHours(getScheduleHour(hour, period), Number(minute), 0, 0)
    return dateTime
}
