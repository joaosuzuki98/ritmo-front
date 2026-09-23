import { z } from 'zod'

export const addHabitSchema = z.object({
    name: z.string().trim().min(1, 'Give your habit a name.'),
    description: z.string().trim().optional(),
    categoryName: z.string().trim().optional(),
    frequencyType: z.enum(['daily', 'weekly']),
    weekDays: z.array(z.number()).min(1, 'Choose at least one day.'),
    priority: z.enum(['low', 'medium', 'high']),
    estimatedDurationMinutes: z
        .string()
        .refine(value => value.trim() === '' || /^\d+$/.test(value), {
            message: 'Use minutes as a whole number.',
        })
        .refine(value => value.trim() === '' || Number(value) > 0, {
            message: 'Duration must be greater than zero.',
        }),
    preferredTime: z
        .string()
        .refine(
            value =>
                value.trim() === '' || /^([01]\d|2[0-3]):[0-5]\d$/.test(value),
            {
                message: 'Use the HH:MM format.',
            },
        ),
    isFocusOfDay: z.boolean(),
})

export type AddHabitFormData = z.infer<typeof addHabitSchema>
