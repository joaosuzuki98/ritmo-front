import { useEffect, useMemo, useState } from 'react'
import { AccessibilityInfo } from 'react-native'

import { getHabitStatusPresentation } from '../../constants/habitStatuses'
import {
    habitRequirementStatuses,
    type HabitRequirementStatus,
} from '../../constants/habitRequirementStatuses'
import { getIncompletionReasonLabel } from '../../constants/incompletionReasons'
import { getPriorityPresentation } from '../../constants/priorities'
import {
    clampWeekDay,
    cycleWeekDay,
    type WeekDay,
} from '../../constants/weekDays'
import {
    database,
    type Category,
    type CompletionRecord,
    type Event,
    type Habit,
    type HabitCondition,
    type HabitDependency,
    type HabitDisplayPreference,
    type IncompletionReason,
    type Streak,
    type User,
} from '../../database'
import { localDateKey } from '../../utils/normalizeLocalDate'
import type {
    DashboardRenderState,
    HabitCardViewData,
    HabitOption,
    SortCriterion,
} from './habitDashboard.types'
import type { AddHabitFormData } from './addHabitSchema'
import { parsePreferredTime } from './preferredTime'
import { findHabitScheduleConflict } from '../../utils/scheduleConflict'
import type { LogHabitProgressFormData } from './logHabitProgressSchema'
import { wouldCreateHabitRequirementCycle } from './habitRequirementUtils'
import {
    calculateHabitStreak,
    getConditionEligibleDateKeys,
} from './streakUtils'

type HabitSource = Pick<
    Habit,
    | 'id'
    | 'userId'
    | 'categoryId'
    | 'name'
    | 'description'
    | 'frequencyType'
    | 'weekDays'
    | 'priority'
    | 'status'
    | 'estimatedDurationMinutes'
    | 'preferredTime'
    | 'isFocusOfDay'
    | 'seasonalStart'
    | 'seasonalEnd'
    | 'createdAt'
>
type CompletionSource = Pick<
    CompletionRecord,
    | 'habitId'
    | 'date'
    | 'status'
    | 'completionTime'
    | 'incompletionReasonId'
    | 'note'
    | 'distractionLockEnabled'
    | 'updatedAt'
>
type CategorySource = Pick<Category, 'id' | 'userId' | 'name'>
type StreakSource = Pick<Streak, 'habitId' | 'currentStreak' | 'longestStreak'>
type IncompletionReasonSource = Pick<IncompletionReason, 'id' | 'description'>
type HabitDependencySource = Pick<
    HabitDependency,
    'habitId' | 'triggerHabitId' | 'type'
>
type HabitConditionSource = Pick<
    HabitCondition,
    'habitId' | 'conditionHabitId' | 'conditionRule' | 'conditionType'
>

const getConditionStatus = (
    rule: unknown,
): HabitRequirementStatus | undefined => {
    if (!rule || typeof rule !== 'object') return undefined
    const status = (rule as Record<string, unknown>).status
    return habitRequirementStatuses.find(value => value === status)
}

export const getDateForWeekDay = (
    targetWeekDay: WeekDay,
    today = new Date(),
): Date => {
    const todayWeekDay = clampWeekDay(today.getDay() || 7)
    const resolved = new Date(today)
    resolved.setDate(today.getDate() + (targetWeekDay - todayWeekDay))
    return resolved
}

const updateHabitStreak = async (habitId: string, today = new Date()) => {
    const [habit, records, streaks, conditions] = await Promise.all([
        database
            .get<Habit>('habits')
            .find(habitId)
            .catch(() => null),
        database.get<CompletionRecord>('completion_records').query().fetch(),
        database.get<Streak>('streaks').query().fetch(),
        database.get<HabitCondition>('habit_conditions').query().fetch(),
    ])
    if (!habit) return

    const condition = conditions.find(
        item =>
            item.habitId === habitId && item.conditionType === 'habit_status',
    )
    const requiredStatus = condition
        ? getConditionStatus(condition.conditionRule)
        : undefined
    const streakValues = calculateHabitStreak(
        records.filter(record => record.habitId === habitId),
        habit.weekDays,
        today,
        condition && requiredStatus
            ? getConditionEligibleDateKeys(
                  records,
                  condition.conditionHabitId,
                  requiredStatus,
              )
            : undefined,
    )
    const streak = streaks.find(item => item.habitId === habitId)
    await database.write(async () => {
        if (streak) {
            await streak.update(record => {
                record.currentStreak = streakValues.currentStreak
                record.longestStreak = streakValues.longestStreak
            })
        } else {
            await database.get<Streak>('streaks').create(record => {
                record.habitId = habitId
                record.currentStreak = streakValues.currentStreak
                record.longestStreak = streakValues.longestStreak
            })
        }
    })
}

const completeAfterHabitChain = async (
    completedHabitId: string,
    userId: string,
    completionDate: Date,
    completionTime: Date,
) => {
    const dateKey = localDateKey(completionDate)
    const [habits, dependencies, conditions, records] = await Promise.all([
        database.get<Habit>('habits').query().fetch(),
        database.get<HabitDependency>('habit_dependencies').query().fetch(),
        database.get<HabitCondition>('habit_conditions').query().fetch(),
        database.get<CompletionRecord>('completion_records').query().fetch(),
    ])
    const ownedHabits = new Map(
        habits
            .filter(habit => habit.userId === userId)
            .map(habit => [habit.id, habit]),
    )
    const statusByHabitId = new Map<string, string>()
    const latestRecordByHabitId = new Map<string, CompletionRecord>()
    records
        .filter(record => localDateKey(record.date) === dateKey)
        .sort(
            (left, right) =>
                (left.updatedAt?.getTime() ?? left.date.getTime()) -
                (right.updatedAt?.getTime() ?? right.date.getTime()),
        )
        .forEach(record => {
            latestRecordByHabitId.set(record.habitId, record)
            statusByHabitId.set(record.habitId, record.status)
        })
    statusByHabitId.set(completedHabitId, 'completed')

    const queuedHabitIds = [completedHabitId]
    const visitedHabitIds = new Set<string>()
    const habitsToComplete = new Set<string>()
    while (queuedHabitIds.length) {
        const triggerHabitId = queuedHabitIds.shift()!
        if (visitedHabitIds.has(triggerHabitId)) continue
        visitedHabitIds.add(triggerHabitId)

        dependencies
            .filter(
                dependency =>
                    dependency.type === 'after_completion' &&
                    dependency.triggerHabitId === triggerHabitId,
            )
            .forEach(dependency => {
                const dependentHabit = ownedHabits.get(dependency.habitId)
                if (!dependentHabit) return

                const currentStatus = statusByHabitId.get(dependentHabit.id)
                if (currentStatus === 'completed') {
                    queuedHabitIds.push(dependentHabit.id)
                    return
                }
                if (dependentHabit.status === 'paused') return

                const condition = conditions.find(
                    item =>
                        item.habitId === dependentHabit.id &&
                        item.conditionType === 'habit_status',
                )
                if (condition) {
                    const requiredStatus = getConditionStatus(
                        condition.conditionRule,
                    )
                    if (
                        !requiredStatus ||
                        statusByHabitId.get(condition.conditionHabitId) !==
                            requiredStatus
                    )
                        return
                }

                statusByHabitId.set(dependentHabit.id, 'completed')
                habitsToComplete.add(dependentHabit.id)
                queuedHabitIds.push(dependentHabit.id)
            })
    }

    if (!habitsToComplete.size) return

    await database.write(async () => {
        for (const habitId of habitsToComplete) {
            const currentRecord = latestRecordByHabitId.get(habitId)
            if (currentRecord) {
                await currentRecord.update(record => {
                    record.date = completionDate
                    record.status = 'completed'
                    record.completionTime = completionTime
                    record.incompletionReasonId = undefined
                })
            } else {
                await database
                    .get<CompletionRecord>('completion_records')
                    .create(record => {
                        record.habitId = habitId
                        record.date = completionDate
                        record.status = 'completed'
                        record.completionTime = completionTime
                        record.distractionLockEnabled = false
                    })
            }
        }
    })
    await Promise.all(
        [...habitsToComplete].map(habitId =>
            updateHabitStreak(habitId, completionDate),
        ),
    )
}

export const composeHabitCards = (
    habits: readonly HabitSource[],
    categories: readonly CategorySource[],
    completions: readonly CompletionSource[],
    userId: string,
    weekDay: WeekDay,
    selectedDate: Date,
    orderedHabitIds: readonly string[] = [],
    streaks: readonly StreakSource[] = [],
    incompletionReasons: readonly IncompletionReasonSource[] = [],
    dependencies: readonly HabitDependencySource[] = [],
    conditions: readonly HabitConditionSource[] = [],
): HabitCardViewData[] => {
    const categoryById = new Map(
        categories
            .filter(category => category.userId === userId)
            .map(category => [category.id, category.name]),
    )
    const dateKey = localDateKey(selectedDate)
    const reasonById = new Map(
        incompletionReasons.map(reason => [reason.id, reason.description]),
    )
    const completionByHabit = new Map<string, CompletionSource>()
    const completionHistoryByHabit = new Map<string, CompletionSource[]>()

    completions.forEach(record => {
        const history = completionHistoryByHabit.get(record.habitId) ?? []
        history.push(record)
        completionHistoryByHabit.set(record.habitId, history)
        if (localDateKey(record.date) !== dateKey) return
        const current = completionByHabit.get(record.habitId)
        if (
            !current ||
            (record.updatedAt?.getTime() ?? 0) >=
                (current.updatedAt?.getTime() ?? 0)
        )
            completionByHabit.set(record.habitId, record)
    })
    const streakByHabit = new Map(
        streaks.map(streak => [
            streak.habitId,
            {
                current: streak.currentStreak,
                longest: streak.longestStreak,
            },
        ]),
    )
    const habitById = new Map(habits.map(habit => [habit.id, habit]))
    const scheduledHabitIds = new Set(
        habits
            .filter(
                habit =>
                    habit.userId === userId &&
                    habit.name.trim().length > 0 &&
                    habit.weekDays.every(day =>
                        [1, 2, 3, 4, 5, 6, 7].includes(day),
                    ) &&
                    habit.weekDays.includes(weekDay),
            )
            .map(habit => habit.id),
    )
    const visibleHabitIds = new Set(scheduledHabitIds)
    const prerequisiteOnlyIds = new Set<string>()
    let addedPrerequisite = true
    while (addedPrerequisite) {
        addedPrerequisite = false
        dependencies.forEach(dependency => {
            if (
                dependency.type === 'after_completion' &&
                visibleHabitIds.has(dependency.habitId) &&
                !visibleHabitIds.has(dependency.triggerHabitId) &&
                habitById.has(dependency.triggerHabitId)
            ) {
                visibleHabitIds.add(dependency.triggerHabitId)
                prerequisiteOnlyIds.add(dependency.triggerHabitId)
                addedPrerequisite = true
            }
        })
        conditions.forEach(condition => {
            if (
                condition.conditionType === 'habit_status' &&
                visibleHabitIds.has(condition.habitId) &&
                !visibleHabitIds.has(condition.conditionHabitId) &&
                habitById.has(condition.conditionHabitId)
            ) {
                visibleHabitIds.add(condition.conditionHabitId)
                prerequisiteOnlyIds.add(condition.conditionHabitId)
                addedPrerequisite = true
            }
        })
    }
    const statusByHabitId = new Map<string, string>()
    habits.forEach(habit => {
        const status = completionByHabit.get(habit.id)?.status
        if (
            status &&
            habitRequirementStatuses.includes(status as HabitRequirementStatus)
        )
            statusByHabitId.set(habit.id, status)
    })

    const matching = habits
        .filter(
            habit => habit.userId === userId && visibleHabitIds.has(habit.id),
        )
        .map(habit => {
            const completion = completionByHabit.get(habit.id)
            const priority = getPriorityPresentation(habit.priority)
            const isPaused = habit.status === 'paused'
            const dependency = dependencies.find(
                item =>
                    item.habitId === habit.id &&
                    item.type === 'after_completion',
            )
            const condition = conditions.find(
                item =>
                    item.habitId === habit.id &&
                    item.conditionType === 'habit_status',
            )
            const requiredConditionStatus = condition
                ? getConditionStatus(condition.conditionRule)
                : undefined
            const blockingHabitTitles: string[] = []
            if (
                dependency &&
                statusByHabitId.get(dependency.triggerHabitId) !== 'completed'
            ) {
                blockingHabitTitles.push(
                    habitById.get(dependency.triggerHabitId)?.name ??
                        'Linked habit',
                )
            }
            if (
                condition &&
                (!requiredConditionStatus ||
                    statusByHabitId.get(condition.conditionHabitId) !==
                        requiredConditionStatus)
            ) {
                blockingHabitTitles.push(
                    habitById.get(condition.conditionHabitId)?.name ??
                        'Linked habit',
                )
            }
            const dependencyHabit = dependency
                ? habitById.get(dependency.triggerHabitId)
                : undefined
            const conditionHabit = condition
                ? habitById.get(condition.conditionHabitId)
                : undefined
            const status = getHabitStatusPresentation(
                isPaused ? 'paused' : completion?.status ?? habit.status,
            )
            const history = (completionHistoryByHabit.get(habit.id) ?? [])
                .slice()
                .sort(
                    (left, right) => right.date.getTime() - left.date.getTime(),
                )
            const completedCount = history.filter(
                record => record.status === 'completed',
            ).length
            const partialCount = history.filter(
                record => record.status === 'partial',
            ).length
            const skippedCount = history.filter(
                record => record.status === 'skipped',
            ).length
            const attempts = completedCount + partialCount + skippedCount
            const streak = streakByHabit.get(habit.id)
            const calculatedStreak = calculateHabitStreak(
                history,
                habit.weekDays,
                new Date(),
                condition && requiredConditionStatus
                    ? getConditionEligibleDateKeys(
                          completions,
                          condition.conditionHabitId,
                          requiredConditionStatus,
                      )
                    : undefined,
            )
            const card: HabitCardViewData = {
                id: habit.id,
                title: habit.name,
                description: habit.description,
                categoryLabel: habit.categoryId
                    ? categoryById.get(habit.categoryId) ?? ''
                    : '',
                priority: habit.priority,
                priorityLabel: priority.label,
                priorityAccessibleLabel: priority.accessibleLabel,
                priorityColor: priority.color,
                status: isPaused
                    ? 'paused'
                    : completion?.status ?? habit.status,
                statusLabel: status.label,
                isPaused,
                dependencyHabitId: dependency?.triggerHabitId,
                dependencyHabitTitle: dependencyHabit?.name,
                conditionHabitId: condition?.conditionHabitId,
                conditionHabitTitle: conditionHabit?.name,
                conditionStatus: requiredConditionStatus,
                isPrerequisiteOnly: prerequisiteOnlyIds.has(habit.id),
                isBlocked: blockingHabitTitles.length > 0,
                blockingHabitTitles,
                completionTime: completion?.completionTime,
                isFocusOfDay: habit.isFocusOfDay,
                frequencyType: habit.frequencyType,
                weekDays: habit.weekDays,
                estimatedDurationMinutes: habit.estimatedDurationMinutes,
                preferredTime: habit.preferredTime,
                seasonalStart: habit.seasonalStart,
                seasonalEnd: habit.seasonalEnd,
                createdAt: habit.createdAt,
                completedCount,
                partialCount,
                skippedCount,
                successRate: attempts
                    ? ((completedCount + partialCount / 2) / attempts) * 100
                    : 0,
                currentStreak: history.length
                    ? calculatedStreak.currentStreak
                    : streak?.current ?? 0,
                longestStreak: history.length
                    ? calculatedStreak.longestStreak
                    : streak?.longest ?? 0,
                completionHistory: history.map(record => ({
                    date: record.date,
                    status: record.status,
                    completionTime: record.completionTime,
                    incompletionReason: record.incompletionReasonId
                        ? reasonById.get(record.incompletionReasonId)
                        : undefined,
                    note: record.note,
                    distractionLockEnabled: record.distractionLockEnabled,
                })),
                manualIndex: orderedHabitIds.indexOf(habit.id),
                isTemporarilySorted: false,
            }
            return card
        })

    const known = new Map(matching.map(card => [card.id, card]))
    const ordered: HabitCardViewData[] = []
    orderedHabitIds.forEach(id => {
        const card = known.get(id)
        if (card) ordered.push(card)
    })
    const appended = matching.filter(card => !orderedHabitIds.includes(card.id))
    return [...ordered, ...appended].map((card, index) => ({
        ...card,
        manualIndex: index,
    }))
}

export const filterAndSortCards = (
    cards: readonly HabitCardViewData[],
    query: string,
    sort: SortCriterion | null,
): HabitCardViewData[] => {
    const filtered = cards.filter(card =>
        card.title
            .toLocaleLowerCase()
            .includes(query.trim().toLocaleLowerCase()),
    )
    const keepPausedLast = (
        left: HabitCardViewData,
        right: HabitCardViewData,
    ) => {
        if (left.isPaused === right.isPaused) return 0
        return left.isPaused ? 1 : -1
    }
    if (!sort) return [...filtered].sort(keepPausedLast)
    return [...filtered]
        .sort((left, right) => {
            const pausedOrder = keepPausedLast(left, right)
            if (pausedOrder) return pausedOrder
            if (sort === 'title') return left.title.localeCompare(right.title)
            if (sort === 'priority')
                return (
                    getPriorityPresentation(String(right.priority)).rank -
                    getPriorityPresentation(String(left.priority)).rank
                )
            return (
                getHabitStatusPresentation(String(right.status)).rank -
                getHabitStatusPresentation(String(left.status)).rank
            )
        })
        .map(card => ({ ...card, isTemporarilySorted: true }))
}

export const reorderHabitIds = (
    ids: readonly string[],
    sourceIndex: number,
    targetIndex: number,
): string[] => {
    if (
        sourceIndex < 0 ||
        sourceIndex >= ids.length ||
        targetIndex < 0 ||
        targetIndex >= ids.length
    )
        return [...ids]
    const next = [...ids]
    const [moved] = next.splice(sourceIndex, 1)
    next.splice(targetIndex, 0, moved)
    return next
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
    const preferredTime = parsePreferredTime(
        formData.preferredTime,
        formData.preferredTimePeriod,
    )
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

type DashboardData = {
    user: User | null
    cards: HabitCardViewData[]
    habitOptions: HabitOption[]
    categoryOptions: string[]
    preference: HabitDisplayPreference | null
    hasAnyHabits: boolean
}

export const useHabitsDashboardViewModel = (
    currentUserId: string,
    initialWeekDay?: WeekDay,
) => {
    const [weekDay, setWeekDay] = useState<WeekDay>(
        initialWeekDay ?? clampWeekDay(new Date().getDay() || 7),
    )
    const [query, setQuery] = useState('')
    const [sort, setSort] = useState<SortCriterion | null>(null)
    const [data, setData] = useState<DashboardData>({
        user: null,
        cards: [],
        habitOptions: [],
        categoryOptions: [],
        preference: null,
        hasAnyHabits: false,
    })
    const [state, setState] = useState<DashboardRenderState>('loading')
    const [isReducedMotion, setIsReducedMotion] = useState(false)
    const [reloadToken, setReloadToken] = useState(0)

    useEffect(() => {
        AccessibilityInfo.isReduceMotionEnabled().then(setIsReducedMotion)
        const listener = AccessibilityInfo.addEventListener(
            'reduceMotionChanged',
            setIsReducedMotion,
        )
        return () => listener.remove()
    }, [])

    useEffect(() => {
        let active = true
        const load = async () => {
            try {
                const [
                    user,
                    habits,
                    categories,
                    completions,
                    streaks,
                    incompletionReasons,
                    dependencies,
                    conditions,
                    preferences,
                ] = await Promise.all([
                    database
                        .get<User>('users')
                        .find(currentUserId)
                        .catch(() => null),
                    database.get<Habit>('habits').query().fetch(),
                    database.get<Category>('categories').query().fetch(),
                    database
                        .get<CompletionRecord>('completion_records')
                        .query()
                        .fetch(),
                    database.get<Streak>('streaks').query().fetch(),
                    database
                        .get<IncompletionReason>('incompletion_reasons')
                        .query()
                        .fetch(),
                    database
                        .get<HabitDependency>('habit_dependencies')
                        .query()
                        .fetch(),
                    database
                        .get<HabitCondition>('habit_conditions')
                        .query()
                        .fetch(),
                    database
                        .get<HabitDisplayPreference>(
                            'habit_display_preferences',
                        )
                        .query()
                        .fetch(),
                ])
                if (!active) return
                const preference =
                    preferences.find(
                        item =>
                            item.userId === currentUserId &&
                            item.weekDay === weekDay,
                    ) ?? null
                const cards = composeHabitCards(
                    habits,
                    categories,
                    completions,
                    currentUserId,
                    weekDay,
                    getDateForWeekDay(weekDay),
                    preference?.orderedHabitIds ?? [],
                    streaks,
                    incompletionReasons,
                    dependencies,
                    conditions,
                )
                setData({
                    user,
                    cards,
                    habitOptions: habits
                        .filter(
                            habit =>
                                habit.userId === currentUserId &&
                                habit.name.trim().length > 0,
                        )
                        .map(habit => ({ id: habit.id, title: habit.name })),
                    categoryOptions: Array.from(
                        new Set(
                            categories
                                .filter(
                                    category =>
                                        category.userId === currentUserId &&
                                        category.name.trim().length > 0,
                                )
                                .map(category => category.name.trim()),
                        ),
                    ).sort((left, right) => left.localeCompare(right)),
                    preference,
                    hasAnyHabits: habits.some(
                        habit =>
                            habit.userId === currentUserId &&
                            habit.status !== 'deleted',
                    ),
                })
                setState(cards.length === 0 ? 'empty' : 'success')
            } catch {
                if (active) setState('error')
            }
        }
        void load()
        return () => {
            active = false
        }
    }, [currentUserId, reloadToken, weekDay])

    const visibleCards = useMemo(
        () => filterAndSortCards(data.cards, query, sort),
        [data.cards, query, sort],
    )
    const selectedDate = useMemo(() => getDateForWeekDay(weekDay), [weekDay])
    const moveDay = (delta: number) =>
        setWeekDay(current => cycleWeekDay(current + delta))

    const persistOrder = async (ids: string[]) => {
        await database.write(async () => {
            const collection = database.get<HabitDisplayPreference>(
                'habit_display_preferences',
            )
            const current =
                data.preference ??
                (await collection.create(record => {
                    record.userId = currentUserId
                    record.weekDay = weekDay
                    record.orderedHabitIds = ids
                }))
            if (data.preference)
                await current.update(record => {
                    record.orderedHabitIds = ids
                })
        })
        setData(current => ({
            ...current,
            cards: current.cards
                .slice()
                .sort(
                    (left, right) =>
                        ids.indexOf(left.id) - ids.indexOf(right.id),
                ),
            preference: current.preference,
        }))
    }

    const createHabit = async (formData: AddHabitFormData) => {
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

        await database.write(async () => {
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
                record.preferredTime = parsePreferredTime(
                    formData.preferredTime,
                    formData.preferredTimePeriod,
                )
                record.priority = formData.priority
                record.isFocusOfDay = formData.isFocusOfDay
                record.status = 'pending'
            })
            await saveHabitRequirements(habit.id, formData)
        })
        setReloadToken(current => current + 1)
    }

    const updateHabit = async (habitId: string, formData: AddHabitFormData) => {
        const categoryName = formData.categoryName?.trim()
        const persistedHabit = await database
            .get<Habit>('habits')
            .find(habitId)
            .catch(() => null)

        if (persistedHabit && persistedHabit.userId !== currentUserId) return

        const priority = getPriorityPresentation(formData.priority)
        if (!persistedHabit) {
            if (formData.dependencyHabitId || formData.conditionHabitId)
                throw new Error('Save requirements on a persisted habit.')
            setData(current => ({
                ...current,
                cards: current.cards.map(card =>
                    card.id === habitId
                        ? {
                              ...card,
                              title: formData.name.trim(),
                              description:
                                  formData.description?.trim() || undefined,
                              categoryLabel: categoryName ?? '',
                              frequencyType: formData.frequencyType,
                              weekDays:
                                  formData.frequencyType === 'daily'
                                      ? [1, 2, 3, 4, 5, 6, 7]
                                      : formData.weekDays,
                              priority: formData.priority,
                              priorityLabel: priority.label,
                              priorityAccessibleLabel: priority.accessibleLabel,
                              priorityColor: priority.color,
                              estimatedDurationMinutes:
                                  formData.estimatedDurationMinutes.trim()
                                      ? Number(
                                            formData.estimatedDurationMinutes,
                                        )
                                      : undefined,
                              preferredTime: parsePreferredTime(
                                  formData.preferredTime,
                                  formData.preferredTimePeriod,
                              ),
                              isFocusOfDay: formData.isFocusOfDay,
                          }
                        : card,
                ),
            }))
            return
        }

        await validateHabitRequirements(formData, currentUserId, habitId)
        await assertNoHabitScheduleConflict(formData, currentUserId, habitId)

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
        await database.write(async () => {
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
                record.preferredTime = parsePreferredTime(
                    formData.preferredTime,
                    formData.preferredTimePeriod,
                )
                record.priority = formData.priority
                record.isFocusOfDay = formData.isFocusOfDay
            })
            await saveHabitRequirements(
                habitId,
                formData,
                dependencies,
                conditions,
            )
        })

        setReloadToken(current => current + 1)
    }

    const deleteHabit = async (habitId: string) => {
        const persistedHabit = await database
            .get<Habit>('habits')
            .find(habitId)
            .catch(() => null)

        if (persistedHabit && persistedHabit.userId !== currentUserId) return

        if (persistedHabit) {
            const [dependencies, conditions] = await Promise.all([
                database
                    .get<HabitDependency>('habit_dependencies')
                    .query()
                    .fetch(),
                database
                    .get<HabitCondition>('habit_conditions')
                    .query()
                    .fetch(),
            ])
            await database.write(async () => {
                for (const dependency of dependencies) {
                    if (
                        dependency.habitId === habitId ||
                        dependency.triggerHabitId === habitId
                    )
                        await dependency.markAsDeleted()
                }
                for (const condition of conditions) {
                    if (
                        condition.habitId === habitId ||
                        condition.conditionHabitId === habitId
                    )
                        await condition.markAsDeleted()
                }
                await persistedHabit.markAsDeleted()
            })
            setReloadToken(current => current + 1)
            return
        }

        setData(current => {
            const cards = current.cards.filter(card => card.id !== habitId)
            return {
                ...current,
                cards,
            }
        })
    }

    const toggleHabitPause = async (habitId: string) => {
        const currentCard = data.cards.find(card => card.id === habitId)
        if (!currentCard) return
        const nextIsPaused = !currentCard.isPaused
        const nextStatus = nextIsPaused ? 'paused' : 'pending'
        const nextStatusLabel = getHabitStatusPresentation(nextStatus).label
        const persistedHabit = await database
            .get<Habit>('habits')
            .find(habitId)
            .catch(() => null)

        if (!persistedHabit) {
            setData(current => ({
                ...current,
                cards: current.cards.map(card =>
                    card.id === habitId
                        ? {
                              ...card,
                              isPaused: nextIsPaused,
                              status: nextStatus,
                              statusLabel: nextStatusLabel,
                          }
                        : card,
                ),
            }))
            return
        }

        await database.write(async () => {
            await persistedHabit.update(record => {
                record.status = nextStatus
            })
        })
        setReloadToken(current => current + 1)
    }

    const completeHabit = async (habitId: string) => {
        const currentCard = data.cards.find(card => card.id === habitId)
        if (!currentCard || currentCard.isPaused || currentCard.isBlocked)
            return

        const now = new Date()
        const completionTime = getDateForWeekDay(weekDay, now)
        const dateKey = localDateKey(completionTime)
        const alreadyCompleted = currentCard.status === 'completed'
        const completedCount = alreadyCompleted
            ? currentCard.completedCount
            : currentCard.completedCount + 1
        const attempts =
            completedCount + currentCard.partialCount + currentCard.skippedCount
        const completionHistory = currentCard.completionHistory.some(
            record => localDateKey(record.date) === dateKey,
        )
            ? currentCard.completionHistory.map(record =>
                  localDateKey(record.date) === dateKey
                      ? {
                            ...record,
                            status: 'completed',
                            completionTime,
                            incompletionReason: undefined,
                        }
                      : record,
              )
            : [
                  {
                      date: completionTime,
                      status: 'completed',
                      completionTime,
                      distractionLockEnabled: false,
                  },
                  ...currentCard.completionHistory,
              ]
        const applyLocalCompletion = () => {
            setData(current => ({
                ...current,
                cards: current.cards.map(card =>
                    card.id === habitId
                        ? {
                              ...card,
                              status: 'completed',
                              statusLabel: 'Completed',
                              completionTime,
                              completedCount,
                              successRate: attempts
                                  ? ((completedCount +
                                        currentCard.partialCount / 2) /
                                        attempts) *
                                    100
                                  : 0,
                              ...calculateHabitStreak(
                                  completionHistory,
                                  card.weekDays,
                                  now,
                              ),
                              completionHistory,
                          }
                        : card,
                ),
            }))
        }
        const persistedHabit = await database
            .get<Habit>('habits')
            .find(habitId)
            .catch(() => null)

        if (!persistedHabit) {
            applyLocalCompletion()
            return
        }

        const records = await database
            .get<CompletionRecord>('completion_records')
            .query()
            .fetch()
        const currentRecord = records
            .filter(
                record =>
                    record.habitId === habitId &&
                    localDateKey(record.date) === dateKey,
            )
            .sort(
                (left, right) =>
                    (right.updatedAt?.getTime() ?? right.date.getTime()) -
                    (left.updatedAt?.getTime() ?? left.date.getTime()),
            )[0]
        await database.write(async () => {
            if (currentRecord) {
                await currentRecord.update(record => {
                    record.status = 'completed'
                    record.completionTime = completionTime
                    record.incompletionReasonId = undefined
                })
            } else {
                await database
                    .get<CompletionRecord>('completion_records')
                    .create(record => {
                        record.habitId = habitId
                        record.date = completionTime
                        record.status = 'completed'
                        record.completionTime = completionTime
                        record.distractionLockEnabled = false
                    })
            }
        })
        await updateHabitStreak(habitId, now)
        await completeAfterHabitChain(
            habitId,
            currentUserId,
            completionTime,
            completionTime,
        )
        setReloadToken(current => current + 1)
    }

    const recordHabitProgress = async (
        habitId: string,
        formData: LogHabitProgressFormData,
    ) => {
        const currentCard = data.cards.find(card => card.id === habitId)
        if (!currentCard || currentCard.isPaused || currentCard.isBlocked)
            return

        const [hours, minutes] = formData.time.split(':').map(Number)
        const now = new Date()
        const date = getDateForWeekDay(weekDay, now)
        date.setHours(0, 0, 0, 0)
        const completionTime = new Date(date)
        completionTime.setHours(hours, minutes, 0, 0)
        const dateKey = localDateKey(date)
        const note = formData.note.trim() || undefined
        const reasonDescription =
            formData.status === 'completed'
                ? undefined
                : getIncompletionReasonLabel(formData.reason)
        const persistedHabit = await database
            .get<Habit>('habits')
            .find(habitId)
            .catch(() => null)
        const records = persistedHabit
            ? await database
                  .get<CompletionRecord>('completion_records')
                  .query()
                  .fetch()
            : []
        const currentRecord = records
            .filter(
                record =>
                    record.habitId === habitId &&
                    localDateKey(record.date) === dateKey,
            )
            .sort(
                (left, right) =>
                    (right.updatedAt?.getTime() ?? right.date.getTime()) -
                    (left.updatedAt?.getTime() ?? left.date.getTime()),
            )[0]

        if (persistedHabit && persistedHabit.userId !== currentUserId) return

        if (persistedHabit) {
            const reasons = reasonDescription
                ? await database
                      .get<IncompletionReason>('incompletion_reasons')
                      .query()
                      .fetch()
                : []
            const existingReason = reasons.find(
                reason => reason.description === reasonDescription,
            )
            let incompletionReasonId = existingReason?.id

            await database.write(async () => {
                if (reasonDescription && !incompletionReasonId) {
                    const reason = await database
                        .get<IncompletionReason>('incompletion_reasons')
                        .create(record => {
                            record.description = reasonDescription
                        })
                    incompletionReasonId = reason.id
                }

                if (currentRecord) {
                    await currentRecord.update(record => {
                        record.date = date
                        record.status = formData.status
                        record.completionTime = completionTime
                        record.incompletionReasonId = incompletionReasonId
                        record.note = note
                    })
                } else {
                    await database
                        .get<CompletionRecord>('completion_records')
                        .create(record => {
                            record.habitId = habitId
                            record.date = date
                            record.status = formData.status
                            record.completionTime = completionTime
                            record.incompletionReasonId = incompletionReasonId
                            record.note = note
                            record.distractionLockEnabled = false
                        })
                }
            })
            await updateHabitStreak(habitId, now)
            if (formData.status === 'completed')
                await completeAfterHabitChain(
                    habitId,
                    currentUserId,
                    date,
                    completionTime,
                )
        }

        const history = currentCard.completionHistory.some(
            record => localDateKey(record.date) === dateKey,
        )
            ? currentCard.completionHistory.map(record =>
                  localDateKey(record.date) === dateKey
                      ? {
                            ...record,
                            date,
                            status: formData.status,
                            completionTime,
                            incompletionReason: reasonDescription,
                            note,
                        }
                      : record,
              )
            : [
                  {
                      date,
                      status: formData.status,
                      completionTime,
                      incompletionReason: reasonDescription,
                      note,
                      distractionLockEnabled: false,
                  },
                  ...currentCard.completionHistory,
              ]
        const completedCount = history.filter(
            record => record.status === 'completed',
        ).length
        const partialCount = history.filter(
            record => record.status === 'partial',
        ).length
        const skippedCount = history.filter(
            record => record.status === 'skipped',
        ).length
        const attempts = completedCount + partialCount + skippedCount
        const status = getHabitStatusPresentation(formData.status)

        setData(current => ({
            ...current,
            cards: current.cards.map(card =>
                card.id === habitId
                    ? {
                          ...card,
                          status: formData.status,
                          statusLabel: status.label,
                          completionTime,
                          completedCount,
                          partialCount,
                          skippedCount,
                          successRate: attempts
                              ? ((completedCount + partialCount / 2) /
                                    attempts) *
                                100
                              : 0,
                          ...calculateHabitStreak(history, card.weekDays, now),
                          completionHistory: history,
                      }
                    : card,
            ),
        }))
        setReloadToken(current => current + 1)
    }

    return {
        ...data,
        state:
            query && visibleCards.length === 0 && data.cards.length > 0
                ? 'no-results'
                : state,
        weekDay,
        selectedDate,
        query,
        sort,
        visibleCards,
        isReducedMotion,
        setQuery,
        setSort,
        moveDay,
        clearSearch: () => setQuery(''),
        clearSort: () => setSort(null),
        createHabit,
        updateHabit,
        deleteHabit,
        toggleHabitPause,
        completeHabit,
        recordHabitProgress,
        reorder: (sourceIndex: number, targetIndex: number) => {
            const sourceId = visibleCards[sourceIndex]?.id
            const targetId = visibleCards[targetIndex]?.id
            if (!sourceId || !targetId) return
            const ids = data.cards.map(card => card.id)
            const sourcePosition = ids.indexOf(sourceId)
            const targetPosition = ids.indexOf(targetId)
            void persistOrder(
                reorderHabitIds(ids, sourcePosition, targetPosition),
            )
        },
    }
}
