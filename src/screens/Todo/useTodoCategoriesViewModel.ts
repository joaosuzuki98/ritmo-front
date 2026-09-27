import { useEffect, useRef, useState } from 'react'

import { database, type TodoCategory } from '../../database'

const initialCategories = ['College', 'Work']

export const useTodoCategoriesViewModel = (currentUserId: string) => {
    const [categories, setCategories] = useState<TodoCategory[]>([])
    const hasSeededCategories = useRef(false)

    useEffect(() => {
        const collection = database.get<TodoCategory>('todo_categories')
        const seedCategories = async () => {
            await database.write(async () => {
                const existingCategories = await collection.query().fetch()
                const userCategories = existingCategories.filter(
                    category => category.userId === currentUserId,
                )
                const names = new Set(
                    userCategories.map(category => category.name.toLowerCase()),
                )

                for (const name of initialCategories) {
                    if (names.has(name.toLowerCase())) continue
                    const now = new Date()
                    await collection.create(record => {
                        record.userId = currentUserId
                        record.name = name
                        record.createdAt = now
                        record.updatedAt = now
                    })
                }
            })
        }

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

                    if (!hasSeededCategories.current) {
                        hasSeededCategories.current = true
                        seedCategories().catch(() => {
                            hasSeededCategories.current = false
                        })
                    }
                },
                error: () => setCategories([]),
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

    return { categories, createCategory }
}
