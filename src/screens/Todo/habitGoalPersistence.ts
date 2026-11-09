import { Q } from '@nozbe/watermelondb'

import {
    database,
    type CompletionRecord,
    type Goal,
    type Habit,
} from '../../database'
import { normalizeLocalDate } from '../../utils/normalizeLocalDate'
import { countCompletedHabitOccurrences } from './goalUtils'

export type HabitGoalInput = {
    habitId: string
    description: string
    targetValue: number
    deadlineType: 'short_term' | 'medium_term' | 'long_term'
}

export const createHabitGoalLocally = async (
    userId: string,
    input: HabitGoalInput,
) => {
    const habit = await database
        .get<Habit>('habits')
        .find(input.habitId)
        .catch(() => null)
    if (!habit || habit.userId !== userId)
        throw new Error('Choose one of your habits.')
    const completions = await database
        .get<CompletionRecord>('completion_records')
        .query(Q.where('habit_id', habit.id))
        .fetch()
    const today = normalizeLocalDate(new Date())
    const currentValue = countCompletedHabitOccurrences(
        { habitId: habit.id, createdAt: today },
        completions,
        today,
    )
    return database.write(async () =>
        database.get<Goal>('goals').create(record => {
            record.habitId = habit.id
            record.deadlineType = input.deadlineType
            record.description = input.description.trim()
            record.targetValue = input.targetValue
            record.currentValue = currentValue
            record.status =
                currentValue >= input.targetValue ? 'completed' : 'in_progress'
            record.createdAt = today
            record.updatedAt = today
        }),
    )
}

export const updateHabitGoalLocally = async (
    userId: string,
    goalId: string,
    changes: Partial<
        Pick<HabitGoalInput, 'description' | 'targetValue' | 'deadlineType'>
    >,
) => {
    const goal = await database
        .get<Goal>('goals')
        .find(goalId)
        .catch(() => null)
    if (!goal) throw new Error('Goal is no longer available.')
    const habit = await database
        .get<Habit>('habits')
        .find(goal.habitId)
        .catch(() => null)
    if (!habit || habit.userId !== userId)
        throw new Error('Goal is no longer available.')
    const updatedAt = new Date()
    return database.write(async () =>
        goal.update(record => {
            if (changes.description !== undefined)
                record.description = changes.description.trim()
            if (changes.targetValue !== undefined)
                record.targetValue = changes.targetValue
            if (changes.deadlineType !== undefined)
                record.deadlineType = changes.deadlineType
            record.status =
                record.currentValue >= record.targetValue
                    ? 'completed'
                    : 'in_progress'
            record.updatedAt = updatedAt
        }),
    )
}
