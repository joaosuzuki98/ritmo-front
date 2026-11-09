type AiChatErrorStage = 'request' | 'authentication' | 'http' | 'response'

type AiChatErrorDetails = {
    stage: AiChatErrorStage
    status?: number
    fields?: string[]
}

const getErrorMessage = ({ stage, status }: AiChatErrorDetails): string => {
    if (stage === 'request')
        return 'Unable to prepare the AI request. Check the chat data.'
    if (stage === 'response')
        return 'The AI response does not match the expected format.'
    if (stage === 'authentication' || status === 401 || status === 403)
        return 'Unable to authenticate the AI request. Please sign in again.'
    if (status === 400 || status === 422)
        return 'The server rejected the AI request. Check the chat API contract.'
    if (status === 404)
        return 'The AI chat endpoint was not found on the server.'
    if (status === 429) return 'Too many AI requests. Please try again later.'
    if (status !== undefined && status >= 500)
        return 'The AI service failed on the server. Please try again later.'
    return 'Unable to get an AI response. Please try again.'
}

export class AiChatError extends Error {
    readonly details: AiChatErrorDetails

    constructor(details: AiChatErrorDetails) {
        super(getErrorMessage(details))
        this.name = 'AiChatError'
        this.details = details
    }
}
