import { useEffect, useMemo, useRef, useState } from 'react'
import { Q } from '@nozbe/watermelondb'
import { useNetInfo } from '@react-native-community/netinfo'

import { clampWeekDay } from '../../constants/weekDays'
import {
    database,
    type Category,
    type Habit,
    type CompletionRecord,
    type Event,
    type Goal,
    type IncompletionReason,
    type TodoTask,
} from '../../database'
import type { HabitOption } from '../HabitsDashboard/habitDashboard.types'
import type { AddHabitFormData } from '../HabitsDashboard/addHabitSchema'
import {
    createHabitLocally,
    updateHabitLocally,
} from '../HabitsDashboard/habitPersistence'
import { aiEndpoints } from '../../services/endpoints/ai'
import { AiChatError } from '../../services/aiChatError'
import {
    buildAiChatContext,
    getRecentAiChatHistory,
    getAiHabitUpdateFormData,
    isStatisticsQuestion,
    toCreateHabitFormData,
    type AiConversationMessage,
} from './aiChatUtils'
import { buildAiChatStatistics } from './aiChatStatistics'
import { applyAiProposalLocally } from './aiProposalPersistence'

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
    const [statisticsNotice, setStatisticsNotice] = useState<string | null>(
        null,
    )
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
        setStatisticsNotice(null)
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
        setStatisticsNotice(null)
        setInput('')
        const userMessage: AiConversationMessage = {
            id: getNextMessageId(),
            role: 'user',
            content: message,
        }
        setMessages(current => [...current, userMessage])

        try {
            const [
                habits,
                categories,
                completions,
                goals,
                reasons,
                tasks,
                events,
            ] = await Promise.all([
                database
                    .get<Habit>('habits')
                    .query(Q.where('user_id', userId))
                    .fetch(),
                database
                    .get<Category>('categories')
                    .query(Q.where('user_id', userId))
                    .fetch(),
                database
                    .get<CompletionRecord>('completion_records')
                    .query()
                    .fetch(),
                database.get<Goal>('goals').query().fetch(),
                database
                    .get<IncompletionReason>('incompletion_reasons')
                    .query()
                    .fetch(),
                database
                    .get<TodoTask>('todo_tasks')
                    .query(Q.where('user_id', userId))
                    .fetch(),
                database
                    .get<Event>('events')
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
            const statisticsMode = isStatisticsQuestion(message)
            const statistics = statisticsMode
                ? buildAiChatStatistics({
                      habits,
                      completions: completions.filter(record =>
                          habits.some(
                              habit =>
                                  habit.id === record.habitId &&
                                  habit.userId === userId,
                          ),
                      ),
                      categories,
                      goals: goals.filter(goal =>
                          habits.some(
                              habit =>
                                  habit.id === goal.habitId &&
                                  habit.userId === userId,
                          ),
                      ),
                      reasons,
                  })
                : undefined
            const response = await aiEndpoints.chat({
                message,
                mode: statisticsMode ? 'statistics' : 'chat',
                history: history.length ? history : undefined,
                context: {
                    habits: contextHabits,
                    ...(statistics ? { statistics } : {}),
                },
            })
            if (statisticsMode && response.proposal)
                throw new AiChatError({
                    stage: 'response',
                    fields: ['proposal'],
                })
            setStatisticsNotice(
                statisticsMode &&
                    !statistics?.periods?.some(period => period.planned > 0)
                    ? 'There is not enough local history to calculate reliable statistics.'
                    : null,
            )
            const proposal = response.proposal
            const ownsHabit = (id: string) =>
                habits.some(habit => habit.id === id && habit.userId === userId)
            const proposalTargetExists = !proposal
                ? false
                : proposal.type === 'habit.update' ||
                  proposal.type === 'todo.update' ||
                  proposal.type === 'event.update' ||
                  proposal.type === 'goal.update'
                ? (proposal.type === 'habit.update' &&
                      ownsHabit(proposal.entityId)) ||
                  (proposal.type === 'todo.update' &&
                      tasks.some(task => task.id === proposal.entityId)) ||
                  (proposal.type === 'event.update' &&
                      events.some(event => event.id === proposal.entityId)) ||
                  (proposal.type === 'goal.update' &&
                      goals.some(
                          goal =>
                              goal.id === proposal.entityId &&
                              ownsHabit(goal.habitId),
                      ))
                : proposal.type === 'habit.completion.create'
                ? ownsHabit(proposal.habitId)
                : proposal.type === 'goal.create'
                ? ownsHabit(proposal.goal.habitId)
                : true
            const proposalState = proposal
                ? proposalTargetExists
                    ? 'pending'
                    : 'invalid'
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

    const clearChat = () => {
        if (sendLock.current || proposalSaveLock.current) return
        setMessages([])
        setInput('')
        setErrorMessage(null)
        setStatisticsNotice(null)
        setCreateProposalMessageId(null)
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
            !message?.proposal ||
            message.proposal.type === 'habit.create' ||
            message.proposalState !== 'pending' ||
            proposalSaveLock.current
        )
            return

        proposalSaveLock.current = true
        setIsSavingProposal(true)
        setErrorMessage(null)
        try {
            if (message.proposal.type === 'habit.update') {
                const habit = await database
                    .get<Habit>('habits')
                    .find(message.proposal.entityId)
                    .catch(() => null)
                if (!habit || habit.userId !== userId)
                    throw new Error('Habit is no longer available.')
                const formData = await getAiHabitUpdateFormData(
                    userId,
                    habit,
                    message.proposal.changes,
                )
                await updateHabitLocally(
                    userId,
                    habit.id,
                    formData,
                    message.proposal.changes.status,
                )
            } else {
                await applyAiProposalLocally(userId, message.proposal)
            }
            setMessages(current =>
                current.map(item =>
                    item.id === messageId
                        ? { ...item, proposalState: 'applied' }
                        : item,
                ),
            )
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : 'Unable to save this change. Please try again.',
            )
        } finally {
            proposalSaveLock.current = false
            setIsSavingProposal(false)
        }
    }

    return {
        cancelProposal,
        categoryOptions,
        clearChat,
        statisticsNotice,
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
