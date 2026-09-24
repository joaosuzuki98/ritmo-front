import {
    dateKey,
    formatMonthLabel,
    formatScheduleDate,
    getCalendarDays,
    getHourLabel,
    parseScheduleHour,
} from '../../../src/screens/Schedule/useScheduleViewModel'
import { addScheduleItemSchema } from '../../../src/screens/Schedule/addScheduleItemSchema'

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

    it('parses valid full-hour schedule item values', () => {
        expect(
            addScheduleItemSchema.parse({
                endTime: '10:00',
                startTime: '09:00',
                title: 'Team meeting',
            }),
        ).toEqual({
            endTime: '10:00',
            startTime: '09:00',
            title: 'Team meeting',
        })
        expect(parseScheduleHour('09:00')).toBe(9)
    })

    it('rejects an item whose end is not after its start', () => {
        const result = addScheduleItemSchema.safeParse({
            endTime: '09:00',
            startTime: '09:00',
            title: 'Team meeting',
        })

        expect(result.success).toBe(false)
    })

    it('returns every day in a month with leading calendar cells', () => {
        const days = getCalendarDays(new Date(2026, 5, 1))

        expect(days).toHaveLength(31)
        expect(days.slice(0, 1)).toEqual([null])
        expect(days.at(-1)?.getDate()).toBe(30)
        expect(formatMonthLabel(new Date(2026, 5, 1))).toBe('June 2026')
    })
})
