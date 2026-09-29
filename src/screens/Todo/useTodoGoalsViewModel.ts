import { useEffect, useMemo, useState } from 'react'

import {
    database,
    type CompletionRecord,
    type Goal,
    type GroupConsistencyGoal,
    type Habit,
} from '../../database'
import { normalizeLocalDate } from '../../utils/normalizeLocalDate'
import type { AddGoalFormData } from './addGoalSchema'
import {
    calculateGroupGoalProgress,
    countCompletedHabitOccurrences,
    getGoalEndDate,
    getGoalProgressPercent,
    getGoalStatus,
    getGoalTermFromDeadlineType,
    getGoalTermOption,
    getGroupGoalStatus,
    getGroupGoalTermOption,
} from './goalUtils'
import type { TodoGoalCardData, TodoGoalHabitOption } from './todoGoals.types'

export const useTodoGoalsViewModel = (currentUserId: string) => {
    const [habits, setHabits] = useState<Habit[]>([])
    const [goals, setGoals] = useState<Goal[]>([])
    const [groupGoals, setGroupGoals] = useState<GroupConsistencyGoal[]>([])
    const [completions, setCompletions] = useState<CompletionRecord[]>([])

    useEffect(() => {
        const subscriptions = [
            database
                .get<Habit>('habits')
                .query()
                .observe()
                .subscribe({ next: setHabits, error: () => setHabits([]) }),
            database
                .get<Goal>('goals')
                .query()
                .observe()
                .subscribe({ next: setGoals, error: () => setGoals([]) }),
            database
                .get<GroupConsistencyGoal>('group_consistency_goals')
                .query()
                .observe()
                .subscribe({
                    next: setGroupGoals,
                    error: () => setGroupGoals([]),
                }),
            database
                .get<CompletionRecord>('completion_records')
                .query()
                .observe()
                .subscribe({
                    next: setCompletions,
                    error: () => setCompletions([]),
                }),
        ]

        return () =>
            subscriptions.forEach(subscription => subscription.unsubscribe())
    }, [])

    const ownedHabits = useMemo(
        () =>
            habits.filter(
                habit =>
                    habit.userId === currentUserId &&
                    habit.status !== 'deleted' &&
                    habit.name.trim().length > 0,
            ),
        [currentUserId, habits],
    )

    const habitOptions: TodoGoalHabitOption[] = useMemo(
        () =>
            ownedHabits.map(habit => ({
                id: habit.id,
                title: habit.name,
                weekDays: habit.weekDays,
                frequencyType: habit.frequencyType,
            })),
        [ownedHabits],
    )

    const goalCards = useMemo<TodoGoalCardData[]>(() => {
        const today = new Date()
        const habitsById = new Map(ownedHabits.map(habit => [habit.id, habit]))
        const individualGoals = goals
            .filter(goal => habitsById.has(goal.habitId))
            .map(goal => {
                const term = getGoalTermFromDeadlineType(goal.deadlineType)
                const startDate = goal.createdAt ?? today
                const dueDate = getGoalEndDate(startDate, term.value)
                const currentValue = countCompletedHabitOccurrences(
                    goal,
                    completions,
                    today,
                )
                const status = getGoalStatus(
                    currentValue,
                    goal.targetValue,
                    dueDate,
                    today,
                )
                return {
                    type: 'habit' as const,
                    id: goal.id,
                    model: goal,
                    title: habitsById.get(goal.habitId)?.name ?? 'Habit goal',
                    description: goal.description,
                    termLabel: term.label,
                    dueDate,
                    currentValue,
                    targetValue: goal.targetValue,
                    progress: getGoalProgressPercent(
                        currentValue,
                        goal.targetValue,
                    ),
                    status,
                }
            })

        const groupGoalCards = groupGoals
            .filter(goal => goal.userId === currentUserId)
            .map(goal => {
                const term = getGroupGoalTermOption(goal)
                const progress = calculateGroupGoalProgress(
                    goal,
                    habitOptions,
                    completions,
                    today,
                )
                return {
                    type: 'group' as const,
                    id: goal.id,
                    model: goal,
                    title: goal.description?.trim() || 'Habit group',
                    description: `${progress.actualPercentage}% consistency · ${goal.targetPercentage}% target`,
                    termLabel: term.label,
                    dueDate: goal.periodEnd,
                    includedHabitTitles: goal.includedHabitIds.map(
                        id => habitsById.get(id)?.name ?? 'Habit',
                    ),
                    targetPercentage: goal.targetPercentage,
                    actualPercentage: progress.actualPercentage,
                    progress: getGoalProgressPercent(
                        progress.actualPercentage,
                        goal.targetPercentage,
                    ),
                    status: getGroupGoalStatus(
                        progress.actualPercentage,
                        goal.targetPercentage,
                        goal.periodEnd,
                        today,
                    ),
                }
            })

        return [...individualGoals, ...groupGoalCards]
    }, [
        completions,
        currentUserId,
        goals,
        groupGoals,
        habitOptions,
        ownedHabits,
    ])

    useEffect(() => {
        const updates = goalCards.filter(
            card =>
                card.type === 'habit' &&
                (card.model.currentValue !== card.currentValue ||
                    card.model.status !== card.status),
        )
        if (!updates.length) return

        database
            .write(async () => {
                for (const card of updates) {
                    if (card.type !== 'habit') continue
                    await card.model.update(record => {
                        record.currentValue = card.currentValue
                        record.status = card.status
                    })
                }
            })
            .catch(() => undefined)
    }, [goalCards])

    const createGoal = async (formData: AddGoalFormData) => {
        const today = normalizeLocalDate(new Date())
        const term = getGoalTermOption(formData.term)

        if (formData.goalType === 'habit') {
            const habit = ownedHabits.find(item => item.id === formData.habitId)
            if (!habit) throw new Error('Choose one of your habits.')

            await database.write(async () => {
                await database.get<Goal>('goals').create(record => {
                    record.habitId = habit.id
                    record.deadlineType = term.deadlineType
                    record.description = formData.description.trim()
                    record.targetValue = Number(formData.targetValue)
                    record.currentValue = countCompletedHabitOccurrences(
                        { habitId: habit.id, createdAt: today },
                        completions,
                        today,
                    )
                    record.status = 'in_progress'
                    record.createdAt = today
                    record.updatedAt = today
                })
            })
            return
        }

        const selectedHabits = formData.includedHabitIds.filter(id =>
            ownedHabits.some(habit => habit.id === id),
        )
        if (selectedHabits.length < 2)
            throw new Error('Choose at least two of your habits.')
        const periodEnd = getGoalEndDate(today, formData.term)

        await database.write(async () => {
            await database
                .get<GroupConsistencyGoal>('group_consistency_goals')
                .create(record => {
                    record.userId = currentUserId
                    record.targetPercentage = Number(formData.targetPercentage)
                    record.description = formData.description.trim()
                    record.includedHabitIds = selectedHabits
                    record.periodStart = today
                    record.periodEnd = periodEnd
                    record.createdAt = today
                    record.updatedAt = today
                })
        })
    }

    const deleteGoal = async (card: TodoGoalCardData) => {
        await database.write(async () => card.model.markAsDeleted())
    }

    return { createGoal, deleteGoal, goalCards, habitOptions }
}
