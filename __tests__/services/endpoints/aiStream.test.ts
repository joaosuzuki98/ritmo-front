import { aiEndpoints } from '../../../src/services/endpoints/ai'
import { requestAiChatStream } from '../../../src/services/aiChatStream'
import { getValidAccessToken } from '../../../src/services/authSession'

const mockPost = jest.fn()
jest.mock('../../../src/services/api', () => ({
    createApi: jest.fn(() => ({
        post: (...args: unknown[]) => mockPost(...args),
    })),
}))
jest.mock('../../../src/services/authSession', () => ({
    getValidAccessToken: jest.fn(),
}))
jest.mock('../../../src/services/aiChatStream', () => ({
    requestAiChatStream: jest.fn(),
}))

const mockToken = jest.mocked(getValidAccessToken)
const mockStream = jest.mocked(requestAiChatStream)

describe('aiEndpoints.streamChat', () => {
    beforeEach(() => {
        jest.resetAllMocks()
        mockToken.mockResolvedValue('token')
        mockStream.mockResolvedValue({
            reply: 'Olá!',
            proposal: null,
            proposalId: null,
            proposalExpiresAt: null,
        })
    })

    it('sends the message, history and language to the authenticated SSE route', async () => {
        const signal = new AbortController().signal
        const input = {
            message: 'Olá',
            history: [{ role: 'user' as const, content: 'Anterior' }],
            language: 'pt' as const,
        }
        await expect(aiEndpoints.streamChat(input, signal)).resolves.toEqual({
            reply: 'Olá!',
            proposal: null,
            proposalId: null,
            proposalExpiresAt: null,
        })
        expect(mockStream).toHaveBeenCalledWith({
            url: expect.stringMatching(/\/api\/v1\/ai\/chat\/stream$/),
            token: 'token',
            body: { ...input, timeZone: expect.any(String) },
            signal,
        })
    })

    it('rejects client context and malformed server proposals', async () => {
        await expect(
            aiEndpoints.streamChat({
                message: 'Olá',
                language: 'pt',
                context: { habits: [] },
            } as never),
        ).rejects.toMatchObject({ details: { stage: 'request' } })
        expect(mockStream).not.toHaveBeenCalled()

        mockStream.mockResolvedValue({
            reply: 'Olá',
            proposal: { type: 'habit.create' },
        })
        await expect(
            aiEndpoints.streamChat({ message: 'Olá', language: 'pt' }),
        ).rejects.toMatchObject({ details: { stage: 'response' } })
    })

    it('requires a token before opening the stream', async () => {
        mockToken.mockResolvedValue(null)
        await expect(
            aiEndpoints.streamChat({ message: 'Olá', language: 'pt' }),
        ).rejects.toMatchObject({ details: { stage: 'authentication' } })
        expect(mockStream).not.toHaveBeenCalled()
    })

    it('sends only the proposal ID and decision to the back-end', async () => {
        mockPost.mockResolvedValue({ data: { status: 'accepted' } })
        const id = '33114aa6-ab20-41d1-9f08-45f439ef7c53'
        await aiEndpoints.decideProposal(id, 'accepted')
        expect(mockPost).toHaveBeenCalledWith(
            `/ai/proposals/${id}/decision`,
            { decision: 'accepted' },
            { headers: { Authorization: 'Bearer token' } },
        )
    })
})
