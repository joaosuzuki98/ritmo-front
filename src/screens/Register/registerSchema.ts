import { z } from 'zod'

export const registerSchema = z
    .object({
        name: z.string().trim().min(2, 'Informe seu nome.'),
        email: z.string().trim().email('Informe um e-mail válido.'),
        password: z
            .string()
            .min(8, 'A senha deve ter pelo menos 8 caracteres.'),
        confirmPassword: z.string().min(1, 'Confirme sua senha.'),
    })
    .refine(data => data.password === data.confirmPassword, {
        message: 'As senhas não coincidem.',
        path: ['confirmPassword'],
    })

export type RegisterFormData = z.infer<typeof registerSchema>
