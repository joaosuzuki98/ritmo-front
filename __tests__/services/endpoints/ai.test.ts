jest.mock('../../../src/services/api', () => ({
    createApi: jest.fn(() => ({ post: jest.fn() })),
}))
jest.mock('../../../src/services/authSession', () => ({
    getValidAccessToken: jest.fn(),
}))
jest.mock('../../../src/constants/api', () => ({
    API_BASE_URL: 'https://api.example.test/api/v1',
}))

import {
    aiChatResponseSchema,
    aiEndpoints,
    type AiChatRequest,
} from '../../../src/services/endpoints/ai'
import { getValidAccessToken } from '../../../src/services/authSession'
import { createApi } from '../../../src/services/api'
import { AiChatError } from '../../../src/services/aiChatError'
import { buildAiChatContext } from '../../../src/screens/AskTheStars/aiChatUtils'
import type { Habit } from '../../../src/database'

const mockGetValidAccessToken = jest.mocked(getValidAccessToken)
const mockPost = jest.mocked(createApi).mock.results[0].value.post

describe('AI chat endpoint', () => {
    it.each([undefined, 'Saúde', 'a'.repeat(100)])(
        'accepts an optional create category of up to 100 characters: %s',
        categoryName => {
            const response = aiChatResponseSchema.parse({
                reply: 'Posso criar Caminhada.',
                proposal: {
                    type: 'habit.create',
                    habit: {
                        name: 'Caminhada',
                        frequencyType: 'daily',
                        ...(categoryName === undefined ? {} : { categoryName }),
                    },
                },
            })

            expect(response.proposal?.type).toBe('habit.create')
            if (response.proposal?.type !== 'habit.create')
                throw new Error('Expected a create proposal')
            expect(response.proposal.habit.categoryName).toBe(categoryName)
        },
    )

    it.each(['a'.repeat(101), null, 123])(
        'rejects an invalid create category: %s',
        categoryName => {
            const result = aiChatResponseSchema.safeParse({
                reply: 'Posso criar Caminhada.',
                proposal: {
                    type: 'habit.create',
                    habit: {
                        name: 'Caminhada',
                        frequencyType: 'daily',
                        categoryName,
                    },
                },
            })

            expect(result.success).toBe(false)
            if (result.success) throw new Error('Expected a validation error')
            expect(result.error.issues[0].path).toEqual([
                'proposal',
                'habit',
                'categoryName',
            ])
        },
    )

    const request: AiChatRequest = {
        message: 'Add a walking habit',
        history: [{ role: 'user', content: 'I want a better routine.' }],
        context: {
            habits: [
                {
                    id: 'habit-1',
                    name: 'Reading',
                    frequencyType: 'daily',
                    weekDays: [1, 2, 3, 4, 5, 6, 7],
                    preferredTime: '19:30',
                },
            ],
        },
    }

    beforeEach(() => {
        jest.clearAllMocks()
        mockGetValidAccessToken.mockResolvedValue('valid-token')
        mockPost.mockResolvedValue({
            data: {
                reply: 'I can add walking each day.',
                proposal: {
                    type: 'habit.create',
                    habit: {
                        name: 'Walking',
                        frequencyType: 'daily',
                        priority: 'medium',
                    },
                },
            },
        })
    })

    it('sends the request with the refreshed bearer token and validates its response', async () => {
        const result = await aiEndpoints.chat(request)

        expect(mockGetValidAccessToken).toHaveBeenCalledTimes(1)
        expect(mockPost).toHaveBeenCalledWith('/ai/chat', request, {
            headers: { Authorization: 'Bearer valid-token' },
        })
        expect(result.proposal?.type).toBe('habit.create')
    })

    it('rejects a response that does not match the Zod contract', async () => {
        mockPost.mockResolvedValue({
            data: { reply: 'Try this.', proposal: { type: 'habit.create' } },
        })

        await expect(aiEndpoints.chat(request)).rejects.toMatchObject({
            name: 'AiChatError',
            details: { stage: 'response', fields: ['proposal.habit'] },
        })
    })

    it('sends habits with absent WatermelonDB fields as omitted optional fields', async () => {
        // WatermelonDB returns null for optional columns, despite the model's
        // optional TypeScript declarations suggesting undefined.
        const habit = {
            id: 'habit-1',
            name: 'Reading',
            frequencyType: 'daily',
            weekDays: [1, 2, 3, 4, 5, 6, 7],
            status: 'pending',
            priority: 'medium',
            description: null,
            estimatedDurationMinutes: null,
            preferredTime: null,
        } as unknown as Habit

        await aiEndpoints.chat({
            message: 'Help with my routine',
            context: { habits: buildAiChatContext([habit]) },
        })

        expect(mockPost).toHaveBeenCalledTimes(1)
        const sent = mockPost.mock.calls[0][1] as AiChatRequest
        expect(sent.context?.habits[0]).toMatchObject({
            id: 'habit-1',
            description: undefined,
            estimatedDurationMinutes: undefined,
            preferredTime: undefined,
        })
        expect(JSON.stringify(sent)).not.toContain('null')
    })

    it('validates outgoing history and context limits before making a request', async () => {
        const invalidRequest: AiChatRequest = {
            ...request,
            history: Array.from({ length: 11 }, () => ({
                role: 'user' as const,
                content: 'Previous message',
            })),
        }

        await expect(aiEndpoints.chat(invalidRequest)).rejects.toMatchObject({
            details: { stage: 'request', fields: ['history'] },
        })
        expect(mockPost).not.toHaveBeenCalled()
    })

    it.each([400, 401, 404, 422, 429, 500, 503])(
        'preserves HTTP %s diagnostics without exposing request data or tokens',
        async status => {
            mockPost.mockRejectedValue({
                isAxiosError: true,
                response: { status, data: { private: 'response-body' } },
                config: { headers: { Authorization: 'Bearer secret' } },
            })

            const error = await aiEndpoints
                .chat(request)
                .catch((failure: unknown) => failure)
            expect(error).toBeInstanceOf(AiChatError)
            if (!(error instanceof AiChatError))
                throw new Error('Expected failure')
            expect(error.details).toEqual({ stage: 'http', status })
            expect(JSON.stringify(error)).not.toContain('secret')
            expect(JSON.stringify(error)).not.toContain('response-body')
        },
    )

    it('does not call the AI endpoint when the access token is unavailable', async () => {
        mockGetValidAccessToken.mockResolvedValue(null)

        await expect(aiEndpoints.chat(request)).rejects.toMatchObject({
            details: { stage: 'authentication' },
        })
        expect(mockPost).not.toHaveBeenCalled()
    })

    it('validates proposal field formats with Zod', () => {
        expect(() =>
            aiChatResponseSchema.parse({
                reply: 'Try this.',
                proposal: {
                    type: 'habit.update',
                    entityId: 'habit-1',
                    changes: { preferredTime: '7pm' },
                },
            }),
        ).toThrow()
    })
})
