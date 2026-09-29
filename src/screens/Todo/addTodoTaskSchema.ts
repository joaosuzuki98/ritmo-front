import { z } from 'zod'

export const addTodoTaskSchema = z.object({
    title: z.string().trim().min(1, 'Enter a task name.'),
})

export type AddTodoTaskFormData = z.infer<typeof addTodoTaskSchema>
