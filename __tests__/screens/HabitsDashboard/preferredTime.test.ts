import {
    formatPreferredTime,
    parsePreferredTime,
} from '../../../src/screens/HabitsDashboard/preferredTime'

describe('preferredTime', () => {
    it.each([
        ['00', 'AM', 0],
        ['09', 'AM', 9],
        ['12', 'AM', 0],
        ['00', 'PM', 12],
        ['09', 'PM', 21],
        ['12', 'PM', 12],
    ] as const)(
        'parses %s %s into 24-hour time',
        (hour, period, expectedHour) => {
            const parsed = parsePreferredTime(hour, period)

            expect(parsed?.getHours()).toBe(expectedHour)
            expect(parsed?.getMinutes()).toBe(0)
        },
    )

    it('formats stored 24-hour values for the input', () => {
        const date = new Date()
        date.setHours(0, 5, 0, 0)
        expect(formatPreferredTime(date)).toEqual({ hour: '00', period: 'AM' })

        date.setHours(13, 45, 0, 0)
        expect(formatPreferredTime(date)).toEqual({ hour: '01', period: 'PM' })

        date.setHours(12, 0, 0, 0)
        expect(formatPreferredTime(date)).toEqual({ hour: '12', period: 'PM' })
    })
})
