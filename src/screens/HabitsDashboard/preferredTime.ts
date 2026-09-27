export type PreferredTimePeriod = 'AM' | 'PM'

export type PreferredTimeParts = {
    hour: string
    period: PreferredTimePeriod
}

export const parsePreferredTime = (
    value: string,
    period: PreferredTimePeriod,
): Date | undefined => {
    if (!/^(?:[0-9]|0[0-9]|1[0-2])$/.test(value)) return undefined

    const hourValue = Number(value)
    const hour = (hourValue % 12) + (period === 'PM' ? 12 : 0)
    const date = new Date()
    date.setHours(hour, 0, 0, 0)
    return date
}

export const formatPreferredTime = (value?: Date): PreferredTimeParts => {
    if (!value) return { hour: '', period: 'AM' }

    const hours = value.getHours()
    return {
        hour: String(hours === 0 ? 0 : hours % 12 || 12).padStart(2, '0'),
        period: hours < 12 ? 'AM' : 'PM',
    }
}
