import { weekDays } from '../../constants/weekDays'
import { Q } from '@nozbe/watermelondb'
import {
    database,
    type Category,
    type Habit,
    type HabitCondition,
    type HabitDependency,
} from '../../database'
import type { AddHabitFormData } from '../HabitsDashboard/addHabitSchema'
import { formatPreferredTime } from '../HabitsDashboard/preferredTime'
import type {
    AiChatHabit,
    AiChatMessage,
    AiHabitProposal,
} from '../../services/endpoints/ai'
import { getConditionStatus } from '../HabitsDashboard/habitPersistence'
import { addHabitSchema } from '../HabitsDashboard/addHabitSchema'

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

export const isStatisticsQuestion = (message: string) =>
    /\b(stats?|statistics|analys[ei]s|how many|how often|trend|progress|streak|correlation|completion rate|estat[ií]stic|an[aá]lise|quantos|quantas|frequ[eê]ncia|progresso|sequ[eê]ncia|taxa de conclus[aã]o|correla[cç][aã]o)\b/i.test(
        message,
    )

export const getAiHabitUpdateFormData = async (
    userId: string,
    habit: Habit,
    changes: Extract<AiHabitProposal, { type: 'habit.update' }>['changes'],
): Promise<AddHabitFormData> => {
    const [categories, dependencies, conditions] = await Promise.all([
        database
            .get<Category>('categories')
            .query(Q.where('user_id', userId))
            .fetch(),
        database
            .get<HabitDependency>('habit_dependencies')
            .query(Q.where('habit_id', habit.id))
            .fetch(),
        database
            .get<HabitCondition>('habit_conditions')
            .query(Q.where('habit_id', habit.id))
            .fetch(),
    ])
    const dependency = dependencies.find(
        item => item.type === 'after_completion',
    )
    const condition = conditions.find(
        item => item.conditionType === 'habit_status',
    )
    const formData: AddHabitFormData = {
        name: habit.name,
        description: habit.description ?? '',
        categoryName:
            categories.find(category => category.id === habit.categoryId)
                ?.name ?? '',
        frequencyType: habit.frequencyType === 'weekly' ? 'weekly' : 'daily',
        weekDays: habit.weekDays.length ? habit.weekDays : [1],
        priority:
            habit.priority === 'low' || habit.priority === 'high'
                ? habit.priority
                : 'medium',
        estimatedDurationMinutes:
            habit.estimatedDurationMinutes == null
                ? ''
                : String(habit.estimatedDurationMinutes),
        preferredTime: formatPreferredTime(habit.preferredTime),
        dependencyHabitId: dependency?.triggerHabitId ?? '',
        conditionHabitId: condition?.conditionHabitId ?? '',
        conditionStatus: getConditionStatus(condition?.conditionRule) ?? '',
    }
    if (changes.name !== undefined) formData.name = changes.name
    if (changes.description !== undefined)
        formData.description = changes.description ?? ''
    if (changes.frequencyType !== undefined)
        formData.frequencyType = changes.frequencyType
    if (changes.weekDays !== undefined) formData.weekDays = changes.weekDays
    if (changes.estimatedDurationMinutes !== undefined)
        formData.estimatedDurationMinutes =
            changes.estimatedDurationMinutes === null
                ? ''
                : String(changes.estimatedDurationMinutes)
    if (changes.preferredTime !== undefined)
        formData.preferredTime = changes.preferredTime ?? ''
    if (changes.priority !== undefined) formData.priority = changes.priority
    return addHabitSchema.parse(formData)
}
