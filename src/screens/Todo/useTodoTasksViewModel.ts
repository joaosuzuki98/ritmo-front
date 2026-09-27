import { useEffect, useState } from 'react'

import { database, type TodoTask } from '../../database'
import type { TodoTaskCategory } from './todoTask.types'

export const useTodoTasksViewModel = (currentUserId: string) => {
    const [tasks, setTasks] = useState<TodoTask[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState('')

    useEffect(() => {
        const collection = database.get<TodoTask>('todo_tasks')
        const subscription = collection
            .query()
            .observeWithColumns(['is_complete'])
            .subscribe({
                next: records => {
                    const userTasks = records
                        .filter(task => task.userId === currentUserId)
                        .sort(
                            (left, right) =>
                                (left.createdAt?.getTime() ?? 0) -
                                (right.createdAt?.getTime() ?? 0),
                        )
                    setTasks(userTasks)
                    setIsLoading(false)
                    setLoadError('')
                },
                error: () => {
                    setIsLoading(false)
                    setLoadError('Unable to load tasks. Please try again.')
                },
            })

        return () => subscription.unsubscribe()
    }, [currentUserId])

    const toggleTask = async (taskId: string) => {
        try {
            await database.write(async () => {
                const task = await database
                    .get<TodoTask>('todo_tasks')
                    .find(taskId)
                if (task.userId !== currentUserId) return
                await task.update(record => {
                    record.isComplete = !record.isComplete
                    record.updatedAt = new Date()
                })
            })
        } catch {
            setLoadError('Unable to update this task. Please try again.')
        }
    }

    const createTask = async (title: string, category: TodoTaskCategory) => {
        if (!category.trim()) throw new Error('Choose a category first.')
        const createdAt = new Date()
        await database.write(async () => {
            await database.get<TodoTask>('todo_tasks').create(record => {
                record.userId = currentUserId
                record.title = title.trim()
                record.category = category
                record.isComplete = false
                record.createdAt = createdAt
                record.updatedAt = createdAt
            })
        })
    }

    return { createTask, isLoading, loadError, tasks, toggleTask }
}
