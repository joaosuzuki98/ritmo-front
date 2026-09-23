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
    completionTime?: Date
    isFocusOfDay: boolean
    estimatedDurationMinutes?: number
    preferredTime?: Date
    manualIndex: number
    isTemporarilySorted: boolean
}

export type HabitsDashboardScreenProps = {
    currentUserId: string
    initialWeekDay?: WeekDay
}
