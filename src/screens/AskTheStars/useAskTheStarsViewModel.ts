import { useEffect, useMemo, useState } from 'react'
import { Q } from '@nozbe/watermelondb'

import {
    database,
    type CompletionRecord,
    type Event,
    type Habit,
} from '../../database'
import { analyzeHabitSchedules } from '../../habits/habitScheduleAnalysis'
import type { HabitScheduleSuggestion } from '../../habits/habitScheduleAnalysis'

export const useAskTheStarsViewModel = (
    userId: string,
    initialHabitId?: string,
) => {
    const [habits, setHabits] = useState<Habit[]>([])
    const [events, setEvents] = useState<Event[]>([])
    const [completions, setCompletions] = useState<CompletionRecord[]>([])
    const [selectedHabitId, setSelectedHabitId] = useState<string | null>(
        initialHabitId ?? null,
    )
    const [isSaving, setIsSaving] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        setSelectedHabitId(initialHabitId ?? null)
    }, [initialHabitId])

    useEffect(() => {
        const subscription = database
            .get<Habit>('habits')
            .query(Q.where('user_id', userId))
            .observeWithColumns([
                'name',
                'status',
                'week_days',
                'preferred_time',
                'estimated_duration_minutes',
                'created_at',
                'seasonal_start',
                'seasonal_end',
            ])
            .subscribe(setHabits, () =>
                setErrorMessage('Unable to load your habits.'),
            )

        return () => subscription.unsubscribe()
    }, [userId])

    useEffect(() => {
        const subscription = database
            .get<Event>('events')
            .query(Q.where('user_id', userId))
            .observeWithColumns(['title', 'date_time', 'end_time'])
            .subscribe(setEvents, () =>
                setErrorMessage('Unable to load your schedule.'),
            )

        return () => subscription.unsubscribe()
    }, [userId])

    const habitIdsKey = habits.map(habit => habit.id).join(',')

    useEffect(() => {
        const habitIds = habitIdsKey ? habitIdsKey.split(',') : []
        if (!habitIds.length) {
            setCompletions([])
            return
        }

        const subscription = database
            .get<CompletionRecord>('completion_records')
            .query(Q.where('habit_id', Q.oneOf(habitIds)))
            .observeWithColumns([
                'date',
                'status',
                'completion_time',
                'updated_at',
            ])
            .subscribe(setCompletions, () =>
                setErrorMessage('Unable to load your completion history.'),
            )

        return () => subscription.unsubscribe()
    }, [habitIdsKey])

    const analyses = useMemo(
        () =>
            analyzeHabitSchedules(
                habits.map(habit => ({
                    id: habit.id,
                    name: habit.name,
                    status: habit.status,
                    weekDays: habit.weekDays,
                    preferredTime: habit.preferredTime,
                    estimatedDurationMinutes: habit.estimatedDurationMinutes,
                    createdAt: habit.createdAt,
                    seasonalStart: habit.seasonalStart,
                    seasonalEnd: habit.seasonalEnd,
                })),
                completions.map(completion => ({
                    habitId: completion.habitId,
                    date: completion.date,
                    status: completion.status,
                    completionTime: completion.completionTime,
                    updatedAt: completion.updatedAt,
                })),
                events.map(event => ({
                    id: event.id,
                    title: event.title,
                    dateTime: event.dateTime,
                    endTime: event.endTime,
                })),
            ),
        [completions, events, habits],
    )

    const selectedHabit =
        habits.find(habit => habit.id === selectedHabitId) ?? null
    const selectedAnalysis =
        analyses.find(analysis => analysis.habitId === selectedHabitId) ?? null
    const selectableHabits = habits
        .filter(habit => habit.status !== 'paused')
        .sort((left, right) => {
            const leftAnalysis = analyses.find(
                analysis => analysis.habitId === left.id,
            )
            const rightAnalysis = analyses.find(
                analysis => analysis.habitId === right.id,
            )
            return (
                Number(rightAnalysis?.isLowSuccess ?? false) -
                Number(leftAnalysis?.isLowSuccess ?? false)
            )
        })

    const selectHabit = (habitId: string) => {
        setSelectedHabitId(habitId)
        setErrorMessage(null)
    }

    const acceptSuggestion = async (suggestion: HabitScheduleSuggestion) => {
        if (!selectedHabit) return false
        setIsSaving(true)
        setErrorMessage(null)

        try {
            const habit = await database
                .get<Habit>('habits')
                .find(selectedHabit.id)
            await database.write(async () => {
                await habit.update(record => {
                    record.weekDays = suggestion.days
                    record.preferredTime = suggestion.time
                })
            })
            return true
        } catch {
            setErrorMessage('Unable to save this suggested schedule.')
            return false
        } finally {
            setIsSaving(false)
        }
    }

    return {
        acceptSuggestion,
        analyses,
        errorMessage,
        isSaving,
        selectableHabits,
        selectHabit,
        selectedAnalysis,
        selectedHabit,
    }
}
