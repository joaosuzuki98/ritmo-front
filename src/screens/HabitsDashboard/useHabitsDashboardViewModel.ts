import { useEffect, useMemo, useState } from 'react'
import { AccessibilityInfo } from 'react-native'

import { getHabitStatusPresentation } from '../../constants/habitStatuses'
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
    type Habit,
    type HabitDisplayPreference,
    type Streak,
    type User,
} from '../../database'
import { localDateKey } from '../../utils/normalizeLocalDate'
import type {
    DashboardRenderState,
    HabitCardViewData,
    SortCriterion,
} from './habitDashboard.types'
import type { AddHabitFormData } from './addHabitSchema'

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
    | 'note'
    | 'distractionLockEnabled'
    | 'updatedAt'
>
type CategorySource = Pick<Category, 'id' | 'userId' | 'name'>
type StreakSource = Pick<Streak, 'habitId' | 'currentStreak' | 'longestStreak'>

const mockCategories: CategorySource[] = [
    { id: 'mock-category', userId: 'local-user', name: 'Categoria ABC' },
]

const mockHabits: HabitSource[] = [
    {
        id: 'mock-high',
        userId: 'local-user',
        categoryId: 'mock-category',
        name: 'Tarefa 2',
        description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris ac hendrerit lacus. Lorem ipsum dolor sit amet Lorem',
        weekDays: [1, 2, 3, 4, 5, 6, 7],
        frequencyType: 'daily',
        priority: 'high',
        status: 'pending',
        isFocusOfDay: true,
    },
    {
        id: 'mock-medium',
        userId: 'local-user',
        categoryId: 'mock-category',
        name: 'Tarefa 2',
        description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris ac hendrerit lacus. Lorem ipsum dolor sit amet Lorem',
        weekDays: [1, 2, 3, 4, 5, 6, 7],
        frequencyType: 'daily',
        priority: 'medium',
        status: 'pending',
        isFocusOfDay: false,
    },
    {
        id: 'mock-low',
        userId: 'local-user',
        categoryId: 'mock-category',
        name: 'Tarefa 2',
        description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris ac hendrerit lacus. Lorem ipsum dolor sit amet Lorem',
        weekDays: [1, 2, 3, 4, 5, 6, 7],
        frequencyType: 'daily',
        priority: 'low',
        status: 'pending',
        isFocusOfDay: false,
    },
]

export const composeHabitCards = (
    habits: readonly HabitSource[],
    categories: readonly CategorySource[],
    completions: readonly CompletionSource[],
    userId: string,
    weekDay: WeekDay,
    selectedDate: Date,
    orderedHabitIds: readonly string[] = [],
    streaks: readonly StreakSource[] = [],
): HabitCardViewData[] => {
    const categoryById = new Map(
        categories
            .filter(category => category.userId === userId)
            .map(category => [category.id, category.name]),
    )
    const dateKey = localDateKey(selectedDate)
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

    const matching = habits
        .filter(
            habit =>
                habit.userId === userId &&
                habit.name.trim().length > 0 &&
                habit.weekDays.every(day =>
                    [1, 2, 3, 4, 5, 6, 7].includes(day),
                ) &&
                habit.weekDays.includes(weekDay),
        )
        .map(habit => {
            const completion = completionByHabit.get(habit.id)
            const priority = getPriorityPresentation(habit.priority)
            const isPaused = habit.status === 'paused'
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
            const skippedCount = history.filter(
                record => record.status === 'skipped',
            ).length
            const attempts = completedCount + skippedCount
            const streak = streakByHabit.get(habit.id)
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
                skippedCount,
                successRate: attempts ? (completedCount / attempts) * 100 : 0,
                currentStreak: streak?.current ?? 0,
                longestStreak: streak?.longest ?? 0,
                completionHistory: history.map(record => ({
                    date: record.date,
                    status: record.status,
                    completionTime: record.completionTime,
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

const parsePreferredTime = (value: string): Date | undefined => {
    if (!value.trim()) return undefined
    const [hours, minutes] = value.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)
    return date
}

type DashboardData = {
    user: User | null
    cards: HabitCardViewData[]
    preference: HabitDisplayPreference | null
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
        preference: null,
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
                const sourceHabits = habits.length > 0 ? habits : mockHabits
                const sourceCategories =
                    categories.length > 0 ? categories : mockCategories
                const cards = composeHabitCards(
                    sourceHabits,
                    sourceCategories,
                    completions,
                    currentUserId,
                    weekDay,
                    new Date(),
                    preference?.orderedHabitIds ?? [],
                    streaks,
                )
                setData({ user, cards, preference })
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

            await database.get<Habit>('habits').create(record => {
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
                )
                record.priority = formData.priority
                record.isFocusOfDay = formData.isFocusOfDay
                record.status = 'pending'
            })
        })
        setReloadToken(current => current + 1)
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
        if (!currentCard || currentCard.isPaused) return

        const completionTime = new Date()
        const dateKey = localDateKey(completionTime)
        const alreadyCompleted = currentCard.status === 'completed'
        const completedCount = alreadyCompleted
            ? currentCard.completedCount
            : currentCard.completedCount + 1
        const attempts = completedCount + currentCard.skippedCount
        const completionHistory = currentCard.completionHistory.some(
            record => localDateKey(record.date) === dateKey,
        )
            ? currentCard.completionHistory.map(record =>
                  localDateKey(record.date) === dateKey
                      ? {
                            ...record,
                            status: 'completed',
                            completionTime,
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
                                  ? (completedCount / attempts) * 100
                                  : 0,
                              currentStreak: Math.max(1, card.currentStreak),
                              longestStreak: Math.max(1, card.longestStreak),
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
        const streaks = await database.get<Streak>('streaks').query().fetch()
        const streak = streaks.find(item => item.habitId === habitId)

        await database.write(async () => {
            if (currentRecord) {
                await currentRecord.update(record => {
                    record.status = 'completed'
                    record.completionTime = completionTime
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

            if (streak) {
                await streak.update(record => {
                    record.currentStreak = Math.max(1, record.currentStreak)
                    record.longestStreak = Math.max(1, record.longestStreak)
                })
            } else {
                await database.get<Streak>('streaks').create(record => {
                    record.habitId = habitId
                    record.currentStreak = 1
                    record.longestStreak = 1
                })
            }
        })
        setReloadToken(current => current + 1)
    }

    return {
        ...data,
        state:
            query && visibleCards.length === 0 && data.cards.length > 0
                ? 'no-results'
                : state,
        weekDay,
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
        toggleHabitPause,
        completeHabit,
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
