import {
    localDateKey,
    normalizeLocalDate,
} from '../../src/utils/normalizeLocalDate'

describe('normalizeLocalDate', () => {
    it('removes time while retaining the local calendar date', () => {
        const normalized = normalizeLocalDate(new Date(2026, 8, 23, 23, 45))
        expect(normalized.getHours()).toBe(0)
        expect(localDateKey(normalized)).toBe('2026-09-23')
    })
})
