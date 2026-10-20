import { registerSchema } from '../../../src/screens/Register/registerSchema'

describe('registerSchema', () => {
    it('validates email and the existing eight-character password minimum', () => {
        expect(
            registerSchema.safeParse({
                email: 'ana@example.com',
                password: 'password123',
            }).success,
        ).toBe(true)
        expect(
            registerSchema.safeParse({
                email: 'not-an-email',
                password: 'password123',
            }).success,
        ).toBe(false)
        expect(
            registerSchema.safeParse({
                email: 'ana@example.com',
                password: 'short',
            }).success,
        ).toBe(false)
    })

    it('does not require password confirmation', () => {
        expect(
            registerSchema.safeParse({
                email: 'ana@example.com',
                password: 'password123',
            }).success,
        ).toBe(true)
        expect(registerSchema.shape).not.toHaveProperty('confirmPassword')
    })
})
