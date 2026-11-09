import { useEffect, useState } from 'react'

import { database, type TodoTask } from '../../database'
import type { TodoTaskCategory } from './todoTask.types'
import {
    createTodoTaskLocally,
    updateTodoTaskLocally,
} from './todoTaskPersistence'

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
            const task = tasks.find(item => item.id === taskId)
            if (!task || task.userId !== currentUserId) return
            await updateTodoTaskLocally(currentUserId, taskId, {
                isComplete: !task.isComplete,
            })
        } catch {
            setLoadError('Unable to update this task. Please try again.')
        }
    }

    const createTask = async (title: string, category: TodoTaskCategory) => {
        if (!category.trim()) throw new Error('Choose a category first.')
        await createTodoTaskLocally(currentUserId, title, category)
    }

    return { createTask, isLoading, loadError, tasks, toggleTask }
}
