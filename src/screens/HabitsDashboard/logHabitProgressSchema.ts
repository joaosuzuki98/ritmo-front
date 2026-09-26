import { z } from 'zod'

export const logHabitProgressSchema = z.object({
    status: z.enum(['completed', 'partial', 'skipped']),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM format.'),
    note: z.string().trim().max(1000, 'Keep notes under 1000 characters.'),
})

export type LogHabitProgressFormData = z.infer<typeof logHabitProgressSchema>
