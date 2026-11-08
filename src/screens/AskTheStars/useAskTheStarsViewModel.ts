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
import { analyzeWeeklyHabitLoad } from '../../habits/habitLoadAnalysis'

type AnalysisData = {
    userId: string
    status: 'loading' | 'success' | 'error'
    habits: Habit[]
    events: Event[]
    completions: CompletionRecord[]
    errorMessage: string | null
}

type HabitSelection = {
    userId: string
    initialHabitId?: string
    habitId: string
}

export const useAskTheStarsViewModel = (
    userId: string,
    initialHabitId?: string,
) => {
    const [data, setData] = useState<AnalysisData>({
        userId,
        status: 'loading',
        habits: [],
        events: [],
        completions: [],
        errorMessage: null,
    })
    const [selection, setSelection] = useState<HabitSelection | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        setSelection(null)
    }, [initialHabitId, userId])

    useEffect(() => {
        let isActive = true
        let hasFailed = false
        let habits: Habit[] | undefined
        let events: Event[] | undefined
        let completions: CompletionRecord[] | undefined
        let habitIdsKey: string | undefined
        let completionSubscription: { unsubscribe: () => void } | undefined

        const publish = () => {
            if (!isActive || hasFailed) return
            setData({
                userId,
                status: habits && events && completions ? 'success' : 'loading',
                habits: habits ?? [],
                events: events ?? [],
                completions: completions ?? [],
                errorMessage: null,
            })
        }
        const handleError = (message: string) => {
            if (!isActive) return
            hasFailed = true
            setData({
                userId,
                status: 'error',
                habits: [],
                events: [],
                completions: [],
                errorMessage: message,
            })
        }

        publish()
        const habitSubscription = database
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
            .subscribe({
                next: records => {
                    if (!isActive || hasFailed) return
                    habits = records
                    const ids = records.map(habit => habit.id).sort()
                    const nextKey = ids.join(',')
                    if (nextKey !== habitIdsKey) {
                        habitIdsKey = nextKey
                        completionSubscription?.unsubscribe()
                        completions = undefined
                        if (!ids.length) {
                            completions = []
                        } else {
                            completionSubscription = database
                                .get<CompletionRecord>('completion_records')
                                .query(Q.where('habit_id', Q.oneOf(ids)))
                                .observeWithColumns([
                                    'date',
                                    'status',
                                    'completion_time',
                                    'updated_at',
                                ])
                                .subscribe({
                                    next: history => {
                                        if (nextKey !== habitIdsKey) return
                                        completions = history
                                        publish()
                                    },
                                    error: () =>
                                        handleError(
                                            'Unable to load your completion history.',
                                        ),
                                })
                        }
                    }
                    publish()
                },
                error: () => handleError('Unable to load your habits.'),
            })

        const eventSubscription = database
            .get<Event>('events')
            .query(Q.where('user_id', userId))
            .observeWithColumns(['title', 'date_time', 'end_time'])
            .subscribe({
                next: records => {
                    events = records
                    publish()
                },
                error: () => handleError('Unable to load your schedule.'),
            })

        return () => {
            isActive = false
            habitSubscription.unsubscribe()
            eventSubscription.unsubscribe()
            completionSubscription?.unsubscribe()
        }
    }, [userId])

    const { habits } = data
    const isLoading = data.userId !== userId || data.status === 'loading'
    const hasLoadError = data.userId === userId && data.status === 'error'
    const isReady = !isLoading && !hasLoadError
    const selectedHabitId =
        selection?.userId === userId &&
        selection.initialHabitId === initialHabitId
            ? selection.habitId
            : initialHabitId

    const analyses = useMemo(() => {
        if (!isReady) return []
        const { habits: loadedHabits, events, completions } = data
        return analyzeHabitSchedules(
            loadedHabits.map(habit => ({
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
        )
    }, [data, isReady])

    const weeklyLoadAnalysis = useMemo(() => {
        if (!isReady) return null
        return analyzeWeeklyHabitLoad(
            habits.map(habit => ({
                id: habit.id,
                name: habit.name,
                status: habit.status,
                weekDays: habit.weekDays,
                estimatedDurationMinutes: habit.estimatedDurationMinutes,
                createdAt: habit.createdAt,
                seasonalStart: habit.seasonalStart,
                seasonalEnd: habit.seasonalEnd,
            })),
            data.completions.map(completion => ({
                habitId: completion.habitId,
                date: completion.date,
                status: completion.status,
                updatedAt: completion.updatedAt,
            })),
            data.events.map(event => ({
                dateTime: event.dateTime,
                endTime: event.endTime,
            })),
        )
    }, [data, habits, isReady])

    const selectedHabit =
        data.userId === userId
            ? habits.find(habit => habit.id === selectedHabitId) ?? null
            : null
    const selectedAnalysis =
        analyses.find(analysis => analysis.habitId === selectedHabitId) ?? null
    const selectableHabits = (isReady ? habits : [])
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
        setSelection({ userId, initialHabitId, habitId })
        setErrorMessage(null)
    }

    const acceptSuggestion = async (suggestion: HabitScheduleSuggestion) => {
        if (!selectedHabit || !isReady || isSaving) return false
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
        errorMessage: data.errorMessage ?? errorMessage,
        hasLoadError,
        isLoading,
        isSaving,
        selectableHabits,
        selectHabit,
        selectedAnalysis,
        selectedHabit,
        weeklyLoadAnalysis,
    }
}
