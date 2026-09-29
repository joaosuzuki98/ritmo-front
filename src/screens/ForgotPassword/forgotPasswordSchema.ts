import { z } from 'zod'

export const forgotPasswordSchema = z.object({
    email: z.string().trim().email('Informe um e-mail válido.'),
})

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
