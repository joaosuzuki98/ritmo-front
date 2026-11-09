import { weekDays } from '../../constants/weekDays'
import type { Habit } from '../../database'
import type { AddHabitFormData } from '../HabitsDashboard/addHabitSchema'
import { formatPreferredTime } from '../HabitsDashboard/preferredTime'
import type {
    AiChatHabit,
    AiChatMessage,
    AiHabitProposal,
} from '../../services/endpoints/ai'

export type AiConversationMessage = AiChatMessage & {
    id: string
    proposal?: AiHabitProposal
    proposalState?: 'pending' | 'applied' | 'cancelled' | 'invalid'
}

export const buildAiChatContext = (habits: readonly Habit[]): AiChatHabit[] =>
    habits
        .filter(habit => habit.status !== 'paused')
        .slice(0, 30)
        .map(habit => ({
            id: habit.id,
            name: habit.name,
            frequencyType: habit.frequencyType as 'daily' | 'weekly',
            description: habit.description ?? undefined,
            weekDays: habit.weekDays,
            estimatedDurationMinutes:
                habit.estimatedDurationMinutes ?? undefined,
            preferredTime:
                formatPreferredTime(habit.preferredTime) || undefined,
            priority: habit.priority as AiChatHabit['priority'],
            status: habit.status as AiChatHabit['status'],
        }))

export const getRecentAiChatHistory = (
    messages: readonly AiConversationMessage[],
): AiChatMessage[] =>
    messages.slice(-10).map(({ role, content }) => ({ role, content }))

export const toCreateHabitFormData = (
    proposal: Extract<AiHabitProposal, { type: 'habit.create' }>,
    initialWeekDay: number,
): AddHabitFormData => ({
    name: proposal.habit.name,
    description: proposal.habit.description ?? '',
    categoryName: proposal.habit.categoryName ?? '',
    frequencyType: proposal.habit.frequencyType,
    weekDays:
        proposal.habit.frequencyType === 'daily'
            ? [...weekDays]
            : proposal.habit.weekDays ?? [initialWeekDay],
    priority: proposal.habit.priority ?? 'medium',
    estimatedDurationMinutes:
        proposal.habit.estimatedDurationMinutes === undefined
            ? ''
            : String(proposal.habit.estimatedDurationMinutes),
    preferredTime: proposal.habit.preferredTime ?? '',
    dependencyHabitId: '',
    conditionHabitId: '',
    conditionStatus: '',
})
