export const parsePreferredTime = (value: string): Date | undefined => {
    const match = /^(\d{2}):(\d{2})$/.exec(value)
    if (!match) return undefined

    const [, hourValue, minuteValue] = match
    const hour = Number(hourValue)
    const minute = Number(minuteValue)
    if (hour > 23 || minute > 59) return undefined

    const date = new Date()
    date.setHours(hour, minute, 0, 0)
    return date
}

export const formatPreferredTime = (value?: Date): string =>
    value
        ? `${String(value.getHours()).padStart(2, '0')}:${String(
              value.getMinutes(),
          ).padStart(2, '0')}`
        : ''
