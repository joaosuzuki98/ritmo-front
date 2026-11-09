import { Q } from '@nozbe/watermelondb'

import {
    database,
    type CompletionRecord,
    type Habit,
    type HabitCondition,
    type HabitDependency,
} from '../../database'
import {
    localDateKey,
    normalizeLocalDate,
} from '../../utils/normalizeLocalDate'
import { getConditionStatus } from './habitPersistence'

const validateCanComplete = async (
    userId: string,
    habitId: string,
    date: Date,
) => {
    const habit = await database
        .get<Habit>('habits')
        .find(habitId)
        .catch(() => null)
    if (!habit || habit.userId !== userId)
        throw new Error('Habit is no longer available.')
    if (habit.status === 'paused')
        throw new Error('A paused habit cannot be completed.')
    const dateOnly = normalizeLocalDate(date)
    const weekDay = dateOnly.getDay() || 7
    if (
        (habit.frequencyType === 'weekly' &&
            !habit.weekDays.includes(weekDay)) ||
        (habit.seasonalStart &&
            dateOnly < normalizeLocalDate(habit.seasonalStart)) ||
        (habit.seasonalEnd && dateOnly > normalizeLocalDate(habit.seasonalEnd))
    )
        throw new Error('This habit is not scheduled for the proposed date.')

    const [dependencies, conditions] = await Promise.all([
        database
            .get<HabitDependency>('habit_dependencies')
            .query(Q.where('habit_id', habitId))
            .fetch(),
        database
            .get<HabitCondition>('habit_conditions')
            .query(Q.where('habit_id', habitId))
            .fetch(),
    ])
    const dependency = dependencies.find(
        item => item.type === 'after_completion',
    )
    const condition = conditions.find(
        item => item.conditionType === 'habit_status',
    )
    const requiredIds = [
        dependency?.triggerHabitId,
        condition?.conditionHabitId,
    ].filter((id): id is string => Boolean(id))
    const records = requiredIds.length
        ? await database
              .get<CompletionRecord>('completion_records')
              .query(Q.where('habit_id', Q.oneOf(requiredIds)))
              .fetch()
        : []
    const latestByHabitId = new Map<string, CompletionRecord>()
    records
        .filter(record => localDateKey(record.date) === localDateKey(dateOnly))
        .sort(
            (left, right) =>
                (left.updatedAt?.getTime() ?? left.date.getTime()) -
                (right.updatedAt?.getTime() ?? right.date.getTime()),
        )
        .forEach(record => latestByHabitId.set(record.habitId, record))
    if (
        dependency &&
        latestByHabitId.get(dependency.triggerHabitId)?.status !== 'completed'
    )
        throw new Error('Complete the linked habit before this one.')
    const requiredStatus = condition
        ? getConditionStatus(condition.conditionRule)
        : undefined
    if (
        condition &&
        (!requiredStatus ||
            latestByHabitId.get(condition.conditionHabitId)?.status !==
                requiredStatus)
    )
        throw new Error(
            'The linked habit does not meet this habit’s condition.',
        )
    return habit
}

export const recordHabitCompletionLocally = async (
    userId: string,
    habitId: string,
    date: Date,
    completionTime: Date,
    note?: string,
    clearMissingNote = false,
) => {
    await validateCanComplete(userId, habitId, date)
    const normalizedDate = normalizeLocalDate(date)
    const records = await database
        .get<CompletionRecord>('completion_records')
        .query(Q.where('habit_id', habitId))
        .fetch()
    const currentRecord = records
        .filter(
            record =>
                localDateKey(record.date) === localDateKey(normalizedDate),
        )
        .sort(
            (left, right) =>
                (right.updatedAt?.getTime() ?? right.date.getTime()) -
                (left.updatedAt?.getTime() ?? left.date.getTime()),
        )[0]
    return database.write(async () => {
        if (currentRecord)
            return currentRecord.update(record => {
                record.date = normalizedDate
                record.status = 'completed'
                record.completionTime = completionTime
                record.incompletionReasonId = undefined
                if (note !== undefined || clearMissingNote) record.note = note
            })
        return database
            .get<CompletionRecord>('completion_records')
            .create(record => {
                record.habitId = habitId
                record.date = normalizedDate
                record.status = 'completed'
                record.completionTime = completionTime
                record.note = note
                record.distractionLockEnabled = false
            })
    })
}
