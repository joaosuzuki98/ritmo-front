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

export const useStartYourDayViewModel = (userId: string) => {
    const [data, setData] = useState<FocusHabitData>({
        userId,
        groups: [],
        status: 'loading',
    })
    const [reloadToken, setReloadToken] = useState(0)
    const [pendingHabitIds, setPendingHabitIds] = useState<string[]>([])
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
    const selectedIds = groups
        .flatMap(group => group.entries)
        .filter(entry => entry.isFocusOfDay)
        .map(entry => entry.id)
    const toggleHabit = async (id: string) => {
        const entry = groups
            .flatMap(group => group.entries)
            .find(habit => habit.id === id)
        if (!entry || pendingHabitIds.includes(id)) return

        setSaveError('')
        setPendingHabitIds(current => [...current, id])
        try {
            await database.write(async () => {
                const habit = await database
                    .get<Habit>('habits')
                    .find(id)
                    .catch(() => null)
                if (!habit || habit.userId !== userId)
                    throw new Error('The habit is unavailable.')
                await habit.update(record => {
                    record.isFocusOfDay = !entry.isFocusOfDay
                })
            })
        } catch {
            setSaveError('Unable to update today’s focus. Please try again.')
        } finally {
            setPendingHabitIds(current => current.filter(value => value !== id))
        }
    }

    return {
        groups,
        selectedIds,
        selectedGroups: getSelectedFocusGroups(groups),
        status: data.userId === userId ? data.status : 'loading',
        pendingHabitIds,
        saveError,
        toggleHabit,
        retry: () => setReloadToken(current => current + 1),
    }
}
