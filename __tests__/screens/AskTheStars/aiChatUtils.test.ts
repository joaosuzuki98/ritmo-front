import {
    getRecentAiChatHistory,
    type AiConversationMessage,
} from '../../../src/screens/AskTheStars/aiChatUtils'

describe('Ask the Stars chat helpers', () => {
    it('keeps only the ten most recent conversation turns', () => {
        const messages = Array.from({ length: 12 }, (_, index) => ({
            id: `message-${index}`,
            role: index % 2 === 0 ? 'user' : 'assistant',
            content: `Message ${index}`,
        })) as AiConversationMessage[]

        expect(getRecentAiChatHistory(messages)).toEqual(
            messages.slice(-10).map(({ role, content }) => ({ role, content })),
        )
    })
})
