import { z } from 'zod'

export const addTodoCategorySchema = z.object({
    name: z.string().trim().min(1, 'Enter a category name.'),
})

export type AddTodoCategoryFormData = z.infer<typeof addTodoCategorySchema>
