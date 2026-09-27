import { useEffect, useRef, useState } from 'react'

import { database, type TodoTask } from '../../database'
import type { TodoTaskCategory, TodoTaskSeed } from './todoTask.types'

const initialTasks: TodoTaskSeed[] = [
    {
        title: 'Finish calculator project',
        category: 'College',
        isComplete: false,
    },
    {
        title: 'Study SOLID principles',
        category: 'College',
        isComplete: false,
    },
    {
        title: 'Read “Learn Calculus Fast — The Indian Way”',
        category: 'College',
        isComplete: false,
    },
    {
        title: 'Get an A in the exam',
        category: 'College',
        isComplete: true,
    },
    {
        title: 'Prepare the weekly report',
        category: 'Work',
        isComplete: false,
    },
    {
        title: 'Review project feedback',
        category: 'Work',
        isComplete: false,
    },
    {
        title: 'Plan the next sprint',
        category: 'Work',
        isComplete: true,
    },
]

export const useTodoTasksViewModel = (currentUserId: string) => {
    const [tasks, setTasks] = useState<TodoTask[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState('')
    const hasSeededInitialTasks = useRef(false)

    useEffect(() => {
        const collection = database.get<TodoTask>('todo_tasks')
        const seedInitialTasks = async () => {
            await database.write(async () => {
                const existingTasks = await collection.query().fetch()
                if (existingTasks.some(task => task.userId === currentUserId))
                    return

                const createdAt = new Date()
                for (const [index, task] of initialTasks.entries()) {
                    const taskDate = new Date(createdAt.getTime() + index)
                    await collection.create(record => {
                        record.userId = currentUserId
                        record.title = task.title
                        record.category = task.category
                        record.isComplete = task.isComplete
                        record.createdAt = taskDate
                        record.updatedAt = taskDate
                    })
                }
            })
        }

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

                    if (!userTasks.length && !hasSeededInitialTasks.current) {
                        hasSeededInitialTasks.current = true
                        seedInitialTasks().catch(() => {
                            hasSeededInitialTasks.current = false
                            setLoadError(
                                'Unable to load tasks. Please try again.',
                            )
                        })
                    }
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
