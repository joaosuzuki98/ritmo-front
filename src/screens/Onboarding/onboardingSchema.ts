import { z } from 'zod'

export const onboardingSchema = z.object({
    mascotName: z.string().trim().min(1, 'Informe um nome para o mascote.'),
    name: z
        .string()
        .trim()
        .min(2, 'Informe seu nome com pelo menos 2 caracteres.'),
})

export type OnboardingFormData = z.infer<typeof onboardingSchema>
