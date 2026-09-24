import { z } from 'zod'

export const addTodoTaskSchema = z.object({
    title: z.string().trim().min(1, 'Digite o nome da tarefa.'),
})

export type AddTodoTaskFormData = z.infer<typeof addTodoTaskSchema>
