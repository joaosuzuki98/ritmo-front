import { z } from 'zod'

export const registerSchema = z.object({
    email: z.string().trim().email('Informe um e-mail válido.'),
    password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
})

export type RegisterFormData = z.infer<typeof registerSchema>
