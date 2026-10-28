import { z } from 'zod'

export const onboardingSchema = z.object({
    mascotName: z
        .string()
        .trim()
        .min(1, 'Please enter a name for your mascot.'),
    name: z
        .string()
        .trim()
        .min(2, 'Please enter your name using at least 2 characters.'),
})

export type OnboardingFormData = z.infer<typeof onboardingSchema>
