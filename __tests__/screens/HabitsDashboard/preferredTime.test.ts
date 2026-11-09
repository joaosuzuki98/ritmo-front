import {
    formatPreferredTime,
    parsePreferredTime,
} from '../../../src/screens/HabitsDashboard/preferredTime'

describe('preferredTime', () => {
    it.each([
        ['00:00', 0, 0],
        ['09:35', 9, 35],
        ['23:55', 23, 55],
    ] as const)('parses %s into local time', (value, hour, minute) => {
        const parsed = parsePreferredTime(value)

        expect(parsed?.getHours()).toBe(hour)
        expect(parsed?.getMinutes()).toBe(minute)
    })

    it.each(['24:00', '09:60', '9:05', ''])(
        'rejects invalid time %s',
        value => {
            expect(parsePreferredTime(value)).toBeUndefined()
        },
    )

    it('formats stored time values for the picker', () => {
        const date = new Date()
        date.setHours(0, 5, 0, 0)
        expect(formatPreferredTime(date)).toBe('00:05')

        date.setHours(13, 45, 0, 0)
        expect(formatPreferredTime(date)).toBe('13:45')

        date.setHours(12, 0, 0, 0)
        expect(formatPreferredTime(date)).toBe('12:00')
    })
})
