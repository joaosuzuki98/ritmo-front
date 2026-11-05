import { z } from 'zod'

export const resetPasswordSchema = z
    .object({
        code: z.string().regex(/^\d{8}$/, 'Informe o código de 8 dígitos.'),
        password: z
            .string()
            .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
            .max(128)
            .regex(/\d/, 'A senha precisa conter um número.')
            .regex(
                /[^a-zA-Z0-9]/,
                'A senha precisa conter um caractere especial.',
            ),
        confirmPassword: z.string().min(1, 'Confirme sua senha.'),
    })
    .refine(values => values.password === values.confirmPassword, {
        message: 'As senhas não coincidem.',
        path: ['confirmPassword'],
    })

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
