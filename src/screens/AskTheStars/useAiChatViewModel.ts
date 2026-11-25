import { useEffect, useRef, useState } from 'react'
import { useNetInfo } from '@react-native-community/netinfo'

import { API_BASE_URL } from '../../constants/api'
import { synchronizeDatabase } from '../../database/sync/synchronize'
import { useLanguageStore } from '../../localization/useLanguageStore'
import { aiEndpoints } from '../../services/endpoints/ai'
import { AiChatError } from '../../services/aiChatError'
import {
    getRecentAiChatHistory,
    type AiConversationMessage,
} from './aiChatUtils'

const makeMessageId = (counter: number) => `${Date.now()}-${counter}`

export const useAiChatViewModel = (userId: string) => {
    const { isConnected, isInternetReachable } = useNetInfo()
    const language = useLanguageStore(state => state.language)
    const isOnline = isConnected === true && isInternetReachable !== false
    const [messages, setMessages] = useState<AiConversationMessage[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSavingProposal, setIsSavingProposal] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const sendLock = useRef(false)
    const proposalSaveLock = useRef(false)
    const messageCounter = useRef(0)
    const activeRequest = useRef<AbortController | null>(null)
    const sessionVersion = useRef(0)

    useEffect(() => {
        setMessages([])
        setInput('')
        setErrorMessage(null)
        sessionVersion.current += 1
        sendLock.current = false
        proposalSaveLock.current = false
        setIsLoading(false)
        setIsSavingProposal(false)
        return () => {
            sessionVersion.current += 1
            activeRequest.current?.abort()
            activeRequest.current = null
        }
    }, [userId])

    const getNextMessageId = () => {
        messageCounter.current += 1
        return makeMessageId(messageCounter.current)
    }

    const handleSend = async () => {
        const message = input.trim()
        if (!message || message.length > 2000 || !isOnline || sendLock.current)
            return

        sendLock.current = true
        const controller = new AbortController()
        activeRequest.current = controller
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
            const history = getRecentAiChatHistory(messages).map(item => ({
                ...item,
                content: item.content.slice(0, 2000),
            }))
            const response = await aiEndpoints.streamChat(
                {
                    message,
                    history: history.length ? history : undefined,
                    language,
                },
                controller.signal,
            )
            if (controller.signal.aborted) return
            const proposal = response.proposal
            const assistantMessage: AiConversationMessage = {
                id: getNextMessageId(),
                role: 'assistant',
                content: response.reply,
                proposal: proposal ?? undefined,
                proposalId: response.proposalId ?? undefined,
                proposalState: proposal ? 'pending' : undefined,
            }
            setMessages(current => [...current, assistantMessage])
        } catch (error) {
            if (controller.signal.aborted) return
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
            if (activeRequest.current === controller) {
                activeRequest.current = null
                sendLock.current = false
                setIsLoading(false)
            }
        }
    }

    const clearChat = () => {
        if (sendLock.current || proposalSaveLock.current) return
        setMessages([])
        setInput('')
        setErrorMessage(null)
    }

    const setProposalState = (
        messageId: string,
        proposalState: AiConversationMessage['proposalState'],
    ) => {
        setMessages(current =>
            current.map(item =>
                item.id === messageId ? { ...item, proposalState } : item,
            ),
        )
    }

    const decideProposal = async (
        messageId: string,
        decision: 'accepted' | 'rejected',
    ) => {
        const message = messages.find(item => item.id === messageId)
        if (
            !message?.proposal ||
            !message.proposalId ||
            !isOnline ||
            (message.proposalState !== 'pending' &&
                !(
                    decision === 'accepted' &&
                    message.proposalState === 'syncPending'
                )) ||
            proposalSaveLock.current
        )
            return
        const version = sessionVersion.current
        proposalSaveLock.current = true
        setIsSavingProposal(true)
        setErrorMessage(null)
        try {
            if (message.proposalState === 'pending') {
                await aiEndpoints.decideProposal(message.proposalId, decision)
                if (sessionVersion.current !== version) return
            }
            if (decision === 'rejected') {
                setProposalState(messageId, 'cancelled')
                return
            }
            setProposalState(messageId, 'syncPending')
            try {
                await synchronizeDatabase({ baseUrl: API_BASE_URL })
            } catch {
                if (sessionVersion.current === version)
                    setErrorMessage(
                        'The change was saved on the server but could not be synced. Please retry syncing.',
                    )
                return
            }
            if (sessionVersion.current === version)
                setProposalState(messageId, 'applied')
        } catch (error) {
            if (sessionVersion.current !== version) return
            setErrorMessage(
                error instanceof AiChatError
                    ? error.message
                    : 'Unable to save this change. Please try again.',
            )
        } finally {
            if (sessionVersion.current === version) {
                proposalSaveLock.current = false
                setIsSavingProposal(false)
            }
        }
    }

    return {
        cancelProposal: (messageId: string) =>
            decideProposal(messageId, 'rejected'),
        clearChat,
        confirmProposal: (messageId: string) =>
            decideProposal(messageId, 'accepted'),
        errorMessage,
        handleSend,
        input,
        isLoading,
        isOnline,
        isSavingProposal,
        messages,
        setInput,
    }
}
