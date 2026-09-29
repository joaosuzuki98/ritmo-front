import { cycleWeekDay } from '../../src/constants/weekDays'

describe('cycleWeekDay', () => {
    it('wraps from Sunday to Monday and back', () => {
        expect(cycleWeekDay(8)).toBe(1)
        expect(cycleWeekDay(0)).toBe(7)
    })

    it('keeps regular days unchanged', () => {
        expect(cycleWeekDay(4)).toBe(4)
    })
})
