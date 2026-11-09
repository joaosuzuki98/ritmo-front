import { useEffect, useMemo, useRef, useState } from 'react'
import { Q } from '@nozbe/watermelondb'
import { useNetInfo } from '@react-native-community/netinfo'

import { clampWeekDay } from '../../constants/weekDays'
import {
    database,
    type Category,
    type Habit,
    type HabitCondition,
    type HabitDependency,
} from '../../database'
import type { HabitOption } from '../HabitsDashboard/habitDashboard.types'
import {
    addHabitSchema,
    type AddHabitFormData,
} from '../HabitsDashboard/addHabitSchema'
import {
    createHabitLocally,
    getConditionStatus,
    updateHabitLocally,
} from '../HabitsDashboard/habitPersistence'
import { formatPreferredTime } from '../HabitsDashboard/preferredTime'
import { aiEndpoints } from '../../services/endpoints/ai'
import type { AiHabitProposal } from '../../services/endpoints/ai'
import { AiChatError } from '../../services/aiChatError'
import {
    buildAiChatContext,
    getRecentAiChatHistory,
    toCreateHabitFormData,
    type AiConversationMessage,
} from './aiChatUtils'

type HabitUpdateProposal = Extract<AiHabitProposal, { type: 'habit.update' }>
type HabitUpdateChanges = HabitUpdateProposal['changes']

const getHabitUpdateFormData = async (
    userId: string,
    habitId: string,
    changes: HabitUpdateChanges,
): Promise<AddHabitFormData> => {
    const habit = await database
        .get<Habit>('habits')
        .find(habitId)
        .catch(() => null)
    if (!habit || habit.userId !== userId)
        throw new Error('This habit is no longer available.')

    const [categories, dependencies, conditions] = await Promise.all([
        database
            .get<Category>('categories')
            .query(Q.where('user_id', userId))
            .fetch(),
        database
            .get<HabitDependency>('habit_dependencies')
            .query(Q.where('habit_id', habitId))
            .fetch(),
        database
            .get<HabitCondition>('habit_conditions')
            .query(Q.where('habit_id', habitId))
            .fetch(),
    ])
    const dependency = dependencies.find(
        item => item.type === 'after_completion',
    )
    const condition = conditions.find(
        item => item.conditionType === 'habit_status',
    )
    const weekDay = clampWeekDay(new Date().getDay() || 7)
    const formData: AddHabitFormData = {
        name: habit.name,
        description: habit.description ?? '',
        categoryName:
            categories.find(category => category.id === habit.categoryId)
                ?.name ?? '',
        frequencyType: habit.frequencyType === 'weekly' ? 'weekly' : 'daily',
        weekDays: habit.weekDays.length ? habit.weekDays : [weekDay],
        priority:
            habit.priority === 'low' || habit.priority === 'high'
                ? habit.priority
                : 'medium',
        estimatedDurationMinutes:
            habit.estimatedDurationMinutes === undefined
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

const makeMessageId = (counter: number) => `${Date.now()}-${counter}`

export const useAiChatViewModel = (userId: string) => {
    const { isConnected, isInternetReachable } = useNetInfo()
    const isOnline = isConnected === true && isInternetReachable !== false
    const [messages, setMessages] = useState<AiConversationMessage[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSavingProposal, setIsSavingProposal] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [habitOptions, setHabitOptions] = useState<HabitOption[]>([])
    const [categoryOptions, setCategoryOptions] = useState<string[]>([])
    const [createProposalMessageId, setCreateProposalMessageId] = useState<
        string | null
    >(null)
    const sendLock = useRef(false)
    const proposalSaveLock = useRef(false)
    const messageCounter = useRef(0)

    useEffect(() => {
        setMessages([])
        setInput('')
        setErrorMessage(null)
        setCreateProposalMessageId(null)
        setHabitOptions([])
        setCategoryOptions([])
    }, [userId])

    const createProposalMessage = useMemo(
        () =>
            messages.find(message => message.id === createProposalMessageId) ??
            null,
        [createProposalMessageId, messages],
    )
    const createProposal =
        createProposalMessage?.proposal?.type === 'habit.create'
            ? createProposalMessage.proposal
            : null
    const createInitialFormData = useMemo(() => {
        if (!createProposal) return undefined
        return toCreateHabitFormData(
            createProposal,
            clampWeekDay(new Date().getDay() || 7),
        )
    }, [createProposal])

    const getNextMessageId = () => {
        messageCounter.current += 1
        return makeMessageId(messageCounter.current)
    }

    const handleSend = async () => {
        const message = input.trim()
        if (!message || message.length > 2000 || !isOnline || sendLock.current)
            return

        sendLock.current = true
        setIsLoading(true)
        setErrorMessage(null)
        setInput('')
        const userMessage: AiConversationMessage = {
            id: getNextMessageId(),
            role: 'user',
            content: message,
        }
        setMessages(current => [...current, userMessage])

        try {
            const [habits, categories] = await Promise.all([
                database
                    .get<Habit>('habits')
                    .query(Q.where('user_id', userId))
                    .fetch(),
                database
                    .get<Category>('categories')
                    .query(Q.where('user_id', userId))
                    .fetch(),
            ])
            const contextHabits = buildAiChatContext(habits)
            setHabitOptions(
                habits.map(habit => ({ id: habit.id, title: habit.name })),
            )
            setCategoryOptions(
                Array.from(
                    new Set(
                        categories
                            .map(category => category.name.trim())
                            .filter(Boolean),
                    ),
                ).sort((left, right) => left.localeCompare(right)),
            )

            const history = getRecentAiChatHistory(messages)
            const response = await aiEndpoints.chat({
                message,
                history: history.length ? history : undefined,
                context: { habits: contextHabits },
            })
            const proposal = response.proposal
            const proposalState =
                proposal?.type === 'habit.update' &&
                !contextHabits.some(habit => habit.id === proposal.entityId)
                    ? 'invalid'
                    : proposal
                    ? 'pending'
                    : undefined
            const assistantMessage: AiConversationMessage = {
                id: getNextMessageId(),
                role: 'assistant',
                content: response.reply,
                proposal: proposal ?? undefined,
                proposalState,
            }
            setMessages(current => [...current, assistantMessage])
        } catch (error) {
            if (__DEV__)
                console.warn(
                    'AI chat failed',
                    error instanceof AiChatError
                        ? error.details
                        : { stage: 'local-context' },
                )
            setErrorMessage(
                error instanceof AiChatError
                    ? error.message
                    : 'Unable to get an AI response. Please try again.',
            )
        } finally {
            sendLock.current = false
            setIsLoading(false)
        }
    }

    const cancelProposal = (messageId: string) => {
        setMessages(current =>
            current.map(message =>
                message.id === messageId
                    ? { ...message, proposalState: 'cancelled' }
                    : message,
            ),
        )
    }

    const openCreateProposal = (messageId: string) => {
        const message = messages.find(item => item.id === messageId)
        if (
            message?.proposal?.type !== 'habit.create' ||
            message.proposalState !== 'pending'
        )
            return
        setCreateProposalMessageId(messageId)
    }

    const closeCreateProposal = () => setCreateProposalMessageId(null)

    const createHabitFromProposal = async (formData: AddHabitFormData) => {
        if (
            !createProposalMessage ||
            !createProposal ||
            createProposalMessage.proposalState !== 'pending' ||
            proposalSaveLock.current
        )
            return
        proposalSaveLock.current = true
        setIsSavingProposal(true)
        setErrorMessage(null)
        try {
            await createHabitLocally(
                userId,
                formData,
                createProposal.habit.status,
            )
            setMessages(current =>
                current.map(message =>
                    message.id === createProposalMessage.id
                        ? { ...message, proposalState: 'applied' }
                        : message,
                ),
            )
            closeCreateProposal()
        } catch {
            setErrorMessage('Unable to save this habit. Please try again.')
        } finally {
            proposalSaveLock.current = false
            setIsSavingProposal(false)
        }
    }

    const confirmUpdateProposal = async (messageId: string) => {
        const message = messages.find(item => item.id === messageId)
        if (
            message?.proposal?.type !== 'habit.update' ||
            message.proposalState !== 'pending' ||
            proposalSaveLock.current
        )
            return

        proposalSaveLock.current = true
        setIsSavingProposal(true)
        setErrorMessage(null)
        try {
            const formData = await getHabitUpdateFormData(
                userId,
                message.proposal.entityId,
                message.proposal.changes,
            )
            const status = message.proposal.changes.status
            await updateHabitLocally(
                userId,
                message.proposal.entityId,
                formData,
                status,
            )
            setMessages(current =>
                current.map(item =>
                    item.id === messageId
                        ? { ...item, proposalState: 'applied' }
                        : item,
                ),
            )
        } catch {
            setErrorMessage('Unable to save this change. Please try again.')
        } finally {
            proposalSaveLock.current = false
            setIsSavingProposal(false)
        }
    }

    return {
        cancelProposal,
        categoryOptions,
        closeCreateProposal,
        confirmUpdateProposal,
        createHabitFromProposal,
        createInitialFormData,
        createProposalMessage,
        errorMessage,
        handleSend,
        habitOptions,
        input,
        isLoading,
        isOnline,
        isSavingProposal,
        messages,
        openCreateProposal,
        setInput,
    }
}
