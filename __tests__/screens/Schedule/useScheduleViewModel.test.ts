import {
    dateKey,
    formatMonthLabel,
    formatScheduleDate,
    getCalendarDays,
    getHourLabel,
} from '../../../src/screens/Schedule/useScheduleViewModel'

describe('schedule date helpers', () => {
    it('formats the selected date and hour for the schedule header', () => {
        const date = new Date(2026, 5, 12)

        expect(formatScheduleDate(date)).toBe('12 June')
        expect(getHourLabel(6)).toBe('06:00 AM')
        expect(getHourLabel(13)).toBe('01:00 PM')
    })

    it('creates a stable local date key', () => {
        expect(dateKey(new Date(2026, 5, 12))).toBe('2026-06-12')
    })

    it('returns every day in a month with leading calendar cells', () => {
        const days = getCalendarDays(new Date(2026, 5, 1))

        expect(days).toHaveLength(31)
        expect(days.slice(0, 1)).toEqual([null])
        expect(days.at(-1)?.getDate()).toBe(30)
        expect(formatMonthLabel(new Date(2026, 5, 1))).toBe('June 2026')
    })
})
