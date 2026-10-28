import { z } from 'zod'

export const registerSchema = z.object({
    email: z.string().trim().email('Enter a valid email address.'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters.')
        .regex(/\d/, 'Password must contain at least one number.')
        .regex(/[^a-zA-Z0-9]/, 'Password must contain a special character.'),
})

export type RegisterFormData = z.infer<typeof registerSchema>
