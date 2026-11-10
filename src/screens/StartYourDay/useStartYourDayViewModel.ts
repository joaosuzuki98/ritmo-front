import { useEffect, useState } from 'react'
import { Q } from '@nozbe/watermelondb'

import {
    database,
    type Habit,
    type HabitCondition,
    type HabitDependency,
} from '../../database'
import {
    buildFocusHabitGroups,
    getSelectedFocusGroups,
    type FocusHabitGroup,
} from './focusHabitGroups'

type FocusHabitData = {
    userId: string
    groups: FocusHabitGroup[]
    status: 'loading' | 'success' | 'error'
}

type FocusSelectionDraft = {
    userId: string
    ids: string[]
}

export const useStartYourDayViewModel = (userId: string) => {
    const [data, setData] = useState<FocusHabitData>({
        userId,
        groups: [],
        status: 'loading',
    })
    const [reloadToken, setReloadToken] = useState(0)
    const [selectionDraft, setSelectionDraft] =
        useState<FocusSelectionDraft | null>(null)
    const [isSavingSelection, setIsSavingSelection] = useState(false)
    const [saveError, setSaveError] = useState('')

    useEffect(() => {
        let active = true
        let failed = false
        let habits: Habit[] | undefined
        let conditions: HabitCondition[] | undefined
        let dependencies: HabitDependency[] | undefined
        setData({ userId, groups: [], status: 'loading' })

        const publish = () => {
            if (!active || failed || !habits || !conditions || !dependencies)
                return
            setData({
                userId,
                groups: buildFocusHabitGroups(
                    habits,
                    conditions,
                    dependencies,
                    userId,
                ),
                status: 'success',
            })
        }
        const handleError = () => {
            failed = true
            if (active) setData({ userId, groups: [], status: 'error' })
        }
        const subscriptions = [
            database
                .get<Habit>('habits')
                .query(Q.where('user_id', userId))
                .observeWithColumns(['name', 'status', 'is_focus_of_day'])
                .subscribe({
                    next: records => {
                        habits = records
                        publish()
                    },
                    error: handleError,
                }),
            database
                .get<HabitCondition>('habit_conditions')
                .query()
                .observeWithColumns([
                    'habit_id',
                    'condition_habit_id',
                    'condition_type',
                ])
                .subscribe({
                    next: records => {
                        conditions = records
                        publish()
                    },
                    error: handleError,
                }),
            database
                .get<HabitDependency>('habit_dependencies')
                .query()
                .observeWithColumns(['habit_id', 'trigger_habit_id', 'type'])
                .subscribe({
                    next: records => {
                        dependencies = records
                        publish()
                    },
                    error: handleError,
                }),
        ]
        return () => {
            active = false
            subscriptions.forEach(subscription => subscription.unsubscribe())
        }
    }, [userId, reloadToken])

    const groups = data.userId === userId ? data.groups : []
    const persistedSelectedIds = groups
        .flatMap(group => group.entries)
        .filter(entry => entry.isFocusOfDay)
        .map(entry => entry.id)
    const selectedIds =
        selectionDraft?.userId === userId
            ? selectionDraft.ids
            : persistedSelectedIds
    const toggleHabit = (id: string) => {
        const entryExists = groups.some(group =>
            group.entries.some(habit => habit.id === id),
        )
        if (!entryExists || isSavingSelection) return

        setSaveError('')
        setSelectionDraft(current => {
            const ids = current?.userId === userId ? current.ids : selectedIds
            return {
                userId,
                ids: ids.includes(id)
                    ? ids.filter(value => value !== id)
                    : [...ids, id],
            }
        })
    }

    const saveSelection = async () => {
        if (
            isSavingSelection ||
            data.userId !== userId ||
            data.status !== 'success'
        )
            return false

        const selected = new Set(selectedIds)
        setSaveError('')
        setIsSavingSelection(true)
        try {
            const habits = await database
                .get<Habit>('habits')
                .query(Q.where('user_id', userId))
                .fetch()
            await database.write(async () => {
                for (const habit of habits) {
                    const shouldFocus = selected.has(habit.id)
                    if (habit.isFocusOfDay === shouldFocus) continue
                    await habit.update(record => {
                        record.isFocusOfDay = shouldFocus
                    })
                }
            })
            setData(current => ({
                ...current,
                groups: current.groups.map(group => ({
                    ...group,
                    entries: group.entries.map(entry => ({
                        ...entry,
                        isFocusOfDay: selected.has(entry.id),
                    })),
                })),
            }))
            setSelectionDraft(null)
            return true
        } catch {
            setSaveError('Unable to save today’s focus. Please try again.')
            return false
        } finally {
            setIsSavingSelection(false)
        }
    }

    return {
        groups,
        selectedIds,
        selectedGroups: getSelectedFocusGroups(groups, selectedIds),
        status: data.userId === userId ? data.status : 'loading',
        isSavingSelection,
        saveError,
        toggleHabit,
        saveSelection,
        retry: () => setReloadToken(current => current + 1),
    }
}
