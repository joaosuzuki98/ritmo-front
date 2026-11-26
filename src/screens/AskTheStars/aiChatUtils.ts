import type {
    AiChatMessage,
    AiHabitProposal,
} from '../../services/endpoints/ai'

export type AiConversationMessage = AiChatMessage & {
    id: string
    proposal?: AiHabitProposal
    proposalId?: string
    proposalState?: 'pending' | 'syncPending' | 'applied' | 'cancelled'
}

export const getRecentAiChatHistory = (
    messages: readonly AiConversationMessage[],
): AiChatMessage[] =>
    messages.slice(-10).map(({ role, content }) => ({ role, content }))
