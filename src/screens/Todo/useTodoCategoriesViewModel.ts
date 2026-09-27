import { useEffect, useState } from 'react'

import { database, type TodoCategory } from '../../database'

export const useTodoCategoriesViewModel = (currentUserId: string) => {
    const [categories, setCategories] = useState<TodoCategory[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const collection = database.get<TodoCategory>('todo_categories')
        const subscription = collection
            .query()
            .observe()
            .subscribe({
                next: records => {
                    const userCategories = records
                        .filter(category => category.userId === currentUserId)
                        .sort(
                            (left, right) =>
                                (left.createdAt?.getTime() ?? 0) -
                                (right.createdAt?.getTime() ?? 0),
                        )
                    setCategories(userCategories)
                    setIsLoading(false)
                },
                error: () => {
                    setCategories([])
                    setIsLoading(false)
                },
            })

        return () => subscription.unsubscribe()
    }, [currentUserId])

    const createCategory = async (name: string) => {
        const normalizedName = name.trim()
        const exists = categories.some(
            category =>
                category.name.toLocaleLowerCase() ===
                normalizedName.toLocaleLowerCase(),
        )
        if (exists) throw new Error('This category already exists.')

        const now = new Date()
        await database.write(async () => {
            await database
                .get<TodoCategory>('todo_categories')
                .create(record => {
                    record.userId = currentUserId
                    record.name = normalizedName
                    record.createdAt = now
                    record.updatedAt = now
                })
        })
    }

    return { categories, createCategory, isLoading }
}
