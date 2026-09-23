import type { PriorityCode } from '../../constants/priorities'
import type { HabitStatusCode } from '../../constants/habitStatuses'
import type { WeekDay } from '../../constants/weekDays'

export type SortCriterion = 'title' | 'priority' | 'status'
export type DashboardRenderState =
    | 'loading'
    | 'success'
    | 'empty'
    | 'no-results'
    | 'error'
    | 'offline'
export type BottomRoute = 'habits' | 'calendar' | 'insights'

export type BottomRouteConfig = {
    key: BottomRoute
    label: string
    accessibilityLabel: string
}

export type HabitCompletionViewData = {
    date: Date
    status: string
    completionTime?: Date
    note?: string
    distractionLockEnabled?: boolean
}

export type HabitCardViewData = {
    id: string
    title: string
    description?: string
    categoryLabel: string
    priority: PriorityCode | string
    priorityLabel: string
    priorityAccessibleLabel: string
    priorityColor: string
    status: HabitStatusCode | string
    statusLabel: string
    isPaused: boolean
    completionTime?: Date
    isFocusOfDay: boolean
    frequencyType?: string
    weekDays: number[]
    estimatedDurationMinutes?: number
    preferredTime?: Date
    seasonalStart?: Date
    seasonalEnd?: Date
    createdAt?: Date
    completedCount: number
    skippedCount: number
    successRate: number
    currentStreak: number
    longestStreak: number
    completionHistory: HabitCompletionViewData[]
    manualIndex: number
    isTemporarilySorted: boolean
}

export type HabitsDashboardScreenProps = {
    currentUserId: string
    initialWeekDay?: WeekDay
    isAddHabitModalVisible?: boolean
    onOpenAddHabitModal?: () => void
    onCloseAddHabitModal?: () => void
    isDoubleTapHintVisible?: boolean
    onCloseDoubleTapHint?: () => void
}
