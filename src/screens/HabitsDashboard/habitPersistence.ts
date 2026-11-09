import {
    habitRequirementStatuses,
    type HabitRequirementStatus,
} from '../../constants/habitRequirementStatuses'
import {
    habitStatusCodes,
    type HabitStatusCode,
} from '../../constants/habitStatuses'
import {
    database,
    type Category,
    type Event,
    type Habit,
    type HabitCondition,
    type HabitDependency,
} from '../../database'
import { findHabitScheduleConflict } from '../../utils/scheduleConflict'
import { addHabitSchema, type AddHabitFormData } from './addHabitSchema'
import { parsePreferredTime } from './preferredTime'
import { wouldCreateHabitRequirementCycle } from './habitRequirementUtils'

export const getConditionStatus = (
    rule: unknown,
): HabitRequirementStatus | undefined => {
    if (!rule || typeof rule !== 'object') return undefined
    const status = (rule as Record<string, unknown>).status
    return habitRequirementStatuses.find(value => value === status)
}

const validateHabitRequirements = async (
    formData: AddHabitFormData,
    currentUserId: string,
    habitId?: string,
) => {
    const requiredHabitIds = [
        formData.dependencyHabitId,
        formData.conditionHabitId,
    ].filter(Boolean)
    if (!requiredHabitIds.length) return

    if (habitId && requiredHabitIds.includes(habitId))
        throw new Error('A habit cannot require itself.')

    const habits = await database.get<Habit>('habits').query().fetch()
    const validHabitIds = new Set(
        habits
            .filter(habit => habit.userId === currentUserId)
            .map(habit => habit.id),
    )
    if (requiredHabitIds.some(requiredId => !validHabitIds.has(requiredId)))
        throw new Error('Choose an existing habit as a requirement.')

    if (!habitId) return

    const [dependencies, conditions] = await Promise.all([
        database.get<HabitDependency>('habit_dependencies').query().fetch(),
        database.get<HabitCondition>('habit_conditions').query().fetch(),
    ])
    const ownedHabitIds = new Set(validHabitIds)
    const existingEdges = [
        ...dependencies
            .filter(
                dependency =>
                    ownedHabitIds.has(dependency.habitId) &&
                    ownedHabitIds.has(dependency.triggerHabitId) &&
                    dependency.habitId !== habitId &&
                    dependency.type === 'after_completion',
            )
            .map(dependency => ({
                habitId: dependency.habitId,
                requiredHabitId: dependency.triggerHabitId,
            })),
        ...conditions
            .filter(condition => condition.habitId !== habitId)
            .filter(
                condition =>
                    ownedHabitIds.has(condition.habitId) &&
                    ownedHabitIds.has(condition.conditionHabitId),
            )
            .map(condition => ({
                habitId: condition.habitId,
                requiredHabitId: condition.conditionHabitId,
            })),
    ]
    if (
        wouldCreateHabitRequirementCycle(
            habitId,
            requiredHabitIds,
            existingEdges,
        )
    )
        throw new Error('Habit requirements cannot form a cycle.')
}

const saveHabitRequirements = async (
    habitId: string,
    formData: AddHabitFormData,
    dependencies: readonly HabitDependency[] = [],
    conditions: readonly HabitCondition[] = [],
) => {
    const currentDependencies = dependencies.filter(
        dependency => dependency.habitId === habitId,
    )
    const matchingDependency = currentDependencies.find(
        dependency =>
            dependency.type === 'after_completion' &&
            dependency.triggerHabitId === formData.dependencyHabitId,
    )
    for (const dependency of currentDependencies) {
        if (dependency !== matchingDependency) await dependency.markAsDeleted()
    }

    if (formData.dependencyHabitId && !matchingDependency) {
        await database
            .get<HabitDependency>('habit_dependencies')
            .create(record => {
                record.habitId = habitId
                record.triggerHabitId = formData.dependencyHabitId
                record.type = 'after_completion'
            })
    }

    const currentConditions = conditions.filter(
        condition => condition.habitId === habitId,
    )
    const matchingCondition = currentConditions.find(
        condition =>
            condition.conditionHabitId === formData.conditionHabitId &&
            condition.conditionType === 'habit_status' &&
            getConditionStatus(condition.conditionRule) ===
                formData.conditionStatus,
    )
    for (const condition of currentConditions) {
        if (condition !== matchingCondition) await condition.markAsDeleted()
    }

    if (
        formData.conditionHabitId &&
        formData.conditionStatus &&
        !matchingCondition
    ) {
        await database
            .get<HabitCondition>('habit_conditions')
            .create(record => {
                record.habitId = habitId
                record.conditionHabitId = formData.conditionHabitId
                record.conditionType = 'habit_status'
                record.conditionRule = { status: formData.conditionStatus }
            })
    }
}

const assertNoHabitScheduleConflict = async (
    formData: AddHabitFormData,
    userId: string,
    habitId?: string,
): Promise<void> => {
    const preferredTime = parsePreferredTime(formData.preferredTime)
    if (!preferredTime) return

    const [habits, events] = await Promise.all([
        database.get<Habit>('habits').query().fetch(),
        database.get<Event>('events').query().fetch(),
    ])
    const conflict = findHabitScheduleConflict(
        {
            id: habitId,
            userId,
            weekDays:
                formData.frequencyType === 'daily'
                    ? [1, 2, 3, 4, 5, 6, 7]
                    : formData.weekDays,
            preferredTime,
            estimatedDurationMinutes: formData.estimatedDurationMinutes.trim()
                ? Number(formData.estimatedDurationMinutes)
                : undefined,
        },
        habits.filter(habit => habit.userId === userId),
        events.filter(event => event.userId === userId),
    )

    if (conflict)
        throw new Error(`This time overlaps with “${conflict.title}”.`)
}

const getStatus = (status?: string): HabitStatusCode => {
    if (status && habitStatusCodes.includes(status as HabitStatusCode))
        return status as HabitStatusCode
    return 'pending'
}

export const createHabitLocally = async (
    currentUserId: string,
    input: AddHabitFormData,
    status?: HabitStatusCode,
): Promise<Habit> => {
    const formData = addHabitSchema.parse(input)
    await validateHabitRequirements(formData, currentUserId)
    await assertNoHabitScheduleConflict(formData, currentUserId)
    const categoryName = formData.categoryName?.trim()
    const categories = categoryName
        ? await database.get<Category>('categories').query().fetch()
        : []
    const existingCategory = categories.find(
        category =>
            category.userId === currentUserId &&
            category.name.toLocaleLowerCase() ===
                categoryName?.toLocaleLowerCase(),
    )

    return database.write(async () => {
        let categoryId = existingCategory?.id
        if (categoryName && !categoryId) {
            const category = await database
                .get<Category>('categories')
                .create(record => {
                    record.userId = currentUserId
                    record.name = categoryName
                })
            categoryId = category.id
        }

        const habit = await database.get<Habit>('habits').create(record => {
            record.userId = currentUserId
            record.categoryId = categoryId
            record.name = formData.name.trim()
            record.description = formData.description?.trim() || undefined
            record.frequencyType = formData.frequencyType
            record.weekDays =
                formData.frequencyType === 'daily'
                    ? [1, 2, 3, 4, 5, 6, 7]
                    : formData.weekDays
            record.estimatedDurationMinutes =
                formData.estimatedDurationMinutes.trim()
                    ? Number(formData.estimatedDurationMinutes)
                    : undefined
            record.preferredTime = parsePreferredTime(formData.preferredTime)
            record.priority = formData.priority
            record.isFocusOfDay = false
            record.status = getStatus(status)
        })
        await saveHabitRequirements(habit.id, formData)
        return habit
    })
}

export const updateHabitLocally = async (
    currentUserId: string,
    habitId: string,
    input: AddHabitFormData,
    status?: HabitStatusCode,
): Promise<Habit> => {
    const formData = addHabitSchema.parse(input)
    const persistedHabit = await database
        .get<Habit>('habits')
        .find(habitId)
        .catch(() => null)

    if (!persistedHabit || persistedHabit.userId !== currentUserId)
        throw new Error('This habit is no longer available.')

    await validateHabitRequirements(formData, currentUserId, habitId)
    await assertNoHabitScheduleConflict(formData, currentUserId, habitId)

    const categoryName = formData.categoryName?.trim()
    const categories = categoryName
        ? await database.get<Category>('categories').query().fetch()
        : []
    const existingCategory = categories.find(
        category =>
            category.userId === currentUserId &&
            category.name.toLocaleLowerCase() ===
                categoryName?.toLocaleLowerCase(),
    )
    const [dependencies, conditions] = await Promise.all([
        database.get<HabitDependency>('habit_dependencies').query().fetch(),
        database.get<HabitCondition>('habit_conditions').query().fetch(),
    ])
    let categoryId = existingCategory?.id

    return database.write(async () => {
        if (categoryName && !categoryId) {
            const category = await database
                .get<Category>('categories')
                .create(record => {
                    record.userId = currentUserId
                    record.name = categoryName
                })
            categoryId = category.id
        }

        await persistedHabit.update(record => {
            record.categoryId = categoryId
            record.name = formData.name.trim()
            record.description = formData.description?.trim() || undefined
            record.frequencyType = formData.frequencyType
            record.weekDays =
                formData.frequencyType === 'daily'
                    ? [1, 2, 3, 4, 5, 6, 7]
                    : formData.weekDays
            record.estimatedDurationMinutes =
                formData.estimatedDurationMinutes.trim()
                    ? Number(formData.estimatedDurationMinutes)
                    : undefined
            record.preferredTime = parsePreferredTime(formData.preferredTime)
            record.priority = formData.priority
            if (status) record.status = getStatus(status)
        })
        await saveHabitRequirements(habitId, formData, dependencies, conditions)
        return persistedHabit
    })
}
