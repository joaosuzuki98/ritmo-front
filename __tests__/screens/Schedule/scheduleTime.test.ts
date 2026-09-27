import {
    getScheduleDateTime,
    getScheduleTimeParts,
} from '../../../src/screens/Schedule/scheduleTime'

describe('scheduleTime', () => {
    it.each([
        ['00', 'AM', 0],
        ['09', 'AM', 9],
        ['12', 'AM', 0],
        ['00', 'PM', 12],
        ['09', 'PM', 21],
        ['12', 'PM', 12],
    ] as const)('converts %s %s to hour %i', (hour, period, expected) => {
        const date = getScheduleDateTime(new Date(2026, 5, 12), hour, period)

        expect(date.getHours()).toBe(expected)
        expect(date.getMinutes()).toBe(0)
    })

    it('formats stored hours for the editable time controls', () => {
        expect(getScheduleTimeParts(0)).toEqual({ hour: '00', period: 'AM' })
        expect(getScheduleTimeParts(12)).toEqual({ hour: '12', period: 'PM' })
        expect(getScheduleTimeParts(18)).toEqual({ hour: '06', period: 'PM' })
    })
})
