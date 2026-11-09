import { Q } from '@nozbe/watermelondb'

import { database, type TodoCategory, type TodoTask } from '../../database'

const getCategory = async (userId: string, requestedName?: string) => {
    const categories = await database
        .get<TodoCategory>('todo_categories')
        .query(Q.where('user_id', userId))
        .fetch()
    const name = requestedName?.trim() || categories[0]?.name || ''
    if (!name) return { name: '', existing: undefined }
    const existing = categories.find(
        category =>
            category.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
    )
    return { name: existing?.name ?? name, existing }
}

export const createTodoTaskLocally = async (
    userId: string,
    title: string,
    categoryName?: string,
    createCategoryIfMissing = false,
) => {
    const titleValue = title.trim()
    if (!titleValue) throw new Error('Enter a task name.')
    const category = await getCategory(userId, categoryName)
    const now = new Date()
    return database.write(async () => {
        let resolvedCategory = category.name
        if (category.name && !category.existing && createCategoryIfMissing) {
            const createdCategory = await database
                .get<TodoCategory>('todo_categories')
                .create(record => {
                    record.userId = userId
                    record.name = category.name
                    record.createdAt = now
                    record.updatedAt = now
                })
            resolvedCategory = createdCategory.name
        }
        return database.get<TodoTask>('todo_tasks').create(record => {
            record.userId = userId
            record.title = titleValue
            record.category = resolvedCategory
            record.isComplete = false
            record.createdAt = now
            record.updatedAt = now
        })
    })
}

export const updateTodoTaskLocally = async (
    userId: string,
    taskId: string,
    changes: { title?: string; category?: string | null; isComplete?: boolean },
) => {
    const task = await database
        .get<TodoTask>('todo_tasks')
        .find(taskId)
        .catch(() => null)
    if (!task || task.userId !== userId)
        throw new Error('Task is no longer available.')
    const category =
        changes.category === undefined
            ? undefined
            : changes.category?.trim()
            ? await getCategory(userId, changes.category)
            : { name: '', existing: undefined }
    const now = new Date()
    return database.write(async () => {
        let resolvedCategory = category?.name
        if (category?.name && !category.existing) {
            const createdCategory = await database
                .get<TodoCategory>('todo_categories')
                .create(record => {
                    record.userId = userId
                    record.name = category.name
                    record.createdAt = now
                    record.updatedAt = now
                })
            resolvedCategory = createdCategory.name
        }
        return task.update(record => {
            if (changes.title !== undefined) record.title = changes.title.trim()
            if (resolvedCategory !== undefined)
                record.category = resolvedCategory
            if (changes.isComplete !== undefined)
                record.isComplete = changes.isComplete
            record.updatedAt = now
        })
    })
}
