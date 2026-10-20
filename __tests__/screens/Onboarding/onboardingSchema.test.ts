import { onboardingSchema } from '../../../src/screens/Onboarding/onboardingSchema'

describe('onboarding identity validation', () => {
    it('trims both required names', () => {
        expect(
            onboardingSchema.parse({
                name: ' Ana Silva ',
                mascotName: ' Lua ',
            }),
        ).toEqual({ name: 'Ana Silva', mascotName: 'Lua' })
    })

    it('requires nonblank names and preserves the two-character user-name minimum', () => {
        expect(
            onboardingSchema.safeParse({ name: '  ', mascotName: 'Lua' })
                .success,
        ).toBe(false)
        expect(
            onboardingSchema.safeParse({ name: 'Ana', mascotName: '  ' })
                .success,
        ).toBe(false)
        expect(
            onboardingSchema.safeParse({ name: 'A', mascotName: 'Lua' })
                .success,
        ).toBe(false)
    })
})
