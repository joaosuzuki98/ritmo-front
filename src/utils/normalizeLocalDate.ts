export const normalizeLocalDate = (value: Date): Date => {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}

export const localDateKey = (value: Date): string => {
    const normalized = normalizeLocalDate(value)
    const month = String(normalized.getMonth() + 1).padStart(2, '0')
    const day = String(normalized.getDate()).padStart(2, '0')
    return `${normalized.getFullYear()}-${month}-${day}`
}
