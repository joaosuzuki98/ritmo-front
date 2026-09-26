import { logHabitProgressSchema } from '../../../src/screens/HabitsDashboard/logHabitProgressSchema'

describe('logHabitProgressSchema', () => {
    it.each(['completed', 'partial', 'skipped'] as const)(
        'accepts the %s outcome with a time and observation',
        status => {
            expect(
                logHabitProgressSchema.parse({
                    status,
                    time: '09:35',
                    note: 'Made progress this morning.',
                }),
            ).toMatchObject({ status, time: '09:35' })
        },
    )

    it('rejects invalid times and overly long notes', () => {
        expect(
            logHabitProgressSchema.safeParse({
                status: 'completed',
                time: '25:70',
                note: '',
            }).success,
        ).toBe(false)
        expect(
            logHabitProgressSchema.safeParse({
                status: 'partial',
                time: '09:35',
                note: 'a'.repeat(1001),
            }).success,
        ).toBe(false)
    })
})
