import { z } from 'zod'
import { isAxiosError } from 'axios'

import { habitStatusCodes } from '../../constants/habitStatuses'
import { priorityCodes } from '../../constants/priorities'
import { API_BASE_URL } from '../../constants/api'
import { createApi } from '../api'
import { getValidAccessToken } from '../authSession'
import { AiChatError } from '../aiChatError'
import { requestAiChatStream } from '../aiChatStream'

const weekDaysSchema = z
    .array(z.number().int().min(1).max(7))
    .min(1)
    .max(7)
    .refine(days => new Set(days).size === days.length)

const preferredTimeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/)

const durationSchema = z.number().int().positive()

const chatMessageSchema = z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(2000),
})

const habitProposalFieldsSchema = z.object({
    name: z.string().trim().min(1),
    categoryName: z.string().max(100).optional(),
    frequencyType: z.enum(['daily', 'weekly']),
    description: z.string().optional(),
    weekDays: weekDaysSchema.optional(),
    estimatedDurationMinutes: durationSchema.optional(),
    preferredTime: preferredTimeSchema.optional(),
    priority: z.enum(priorityCodes).optional(),
    status: z.enum(habitStatusCodes).optional(),
})

const habitUpdateChangesSchema = z
    .object({
        name: z.string().trim().min(1).optional(),
        description: z.string().nullable().optional(),
        frequencyType: z.enum(['daily', 'weekly']).optional(),
        weekDays: weekDaysSchema.optional(),
        estimatedDurationMinutes: durationSchema.nullable().optional(),
        preferredTime: preferredTimeSchema.nullable().optional(),
        priority: z.enum(priorityCodes).optional(),
        status: z.enum(habitStatusCodes).optional(),
    })
    .refine(changes => Object.keys(changes).length > 0)

const todoChangesSchema = z
    .object({
        title: z.string().trim().min(1).optional(),
        category: z.string().nullable().optional(),
        isComplete: z.boolean().optional(),
    })
    .refine(changes => Object.keys(changes).length > 0)

const eventChangesSchema = z
    .object({
        title: z.string().trim().min(1).optional(),
        dateTime: z.string().datetime({ offset: true }).optional(),
        endTime: z.string().datetime({ offset: true }).nullable().optional(),
        location: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
        reminderType: z.enum(['normal', 'holiday', 'important_day']).optional(),
    })
    .refine(changes => Object.keys(changes).length > 0)

export const aiAgentRequestSchema = z
    .object({
        message: z.string().trim().min(1).max(2000),
        history: z.array(chatMessageSchema).max(10).optional(),
        language: z.enum(['en', 'pt']),
    })
    .strict()

export const aiChatResponseSchema = z.object({
    reply: z.string(),
    proposal: z
        .discriminatedUnion('type', [
            z.object({
                type: z.literal('habit.create'),
                habit: habitProposalFieldsSchema,
            }),
            z.object({
                type: z.literal('habit.update'),
                entityId: z.string().min(1),
                changes: habitUpdateChangesSchema,
            }),
            z.object({
                type: z.literal('habit.completion.create'),
                habitId: z.string().min(1),
                date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
                completionTime: preferredTimeSchema.optional(),
                note: z.string().max(1000).optional(),
            }),
            z.object({
                type: z.literal('todo.create'),
                task: z.object({
                    title: z.string().trim().min(1),
                    category: z.string().optional(),
                }),
            }),
            z.object({
                type: z.literal('todo.update'),
                entityId: z.string().min(1),
                changes: todoChangesSchema,
            }),
            z.object({
                type: z.literal('event.create'),
                event: z.object({
                    title: z.string().trim().min(1),
                    dateTime: z.string().datetime({ offset: true }),
                    endTime: z.string().datetime({ offset: true }).optional(),
                    location: z.string().optional(),
                    description: z.string().optional(),
                    reminderType: z
                        .enum(['normal', 'holiday', 'important_day'])
                        .optional(),
                }),
            }),
            z.object({
                type: z.literal('event.update'),
                entityId: z.string().min(1),
                changes: eventChangesSchema,
            }),
            z.object({
                type: z.literal('goal.create'),
                goal: z.object({
                    habitId: z.string().min(1),
                    description: z.string().trim().min(1),
                    targetValue: z.number().int().positive(),
                    deadlineType: z.enum([
                        'short_term',
                        'medium_term',
                        'long_term',
                    ]),
                }),
            }),
            z.object({
                type: z.literal('goal.update'),
                entityId: z.string().min(1),
                changes: z
                    .object({
                        description: z.string().trim().min(1).optional(),
                        targetValue: z.number().int().positive().optional(),
                        deadlineType: z
                            .enum(['short_term', 'medium_term', 'long_term'])
                            .optional(),
                    })
                    .refine(changes => Object.keys(changes).length > 0),
            }),
        ])
        .nullable(),
})

export const aiAgentResponseSchema = aiChatResponseSchema
    .extend({
        proposalId: z.uuid().nullable(),
        proposalExpiresAt: z.string().datetime({ offset: true }).nullable(),
    })
    .refine(
        value =>
            value.proposal === null
                ? value.proposalId === null && value.proposalExpiresAt === null
                : value.proposalId !== null && value.proposalExpiresAt !== null,
        { message: 'Proposal and identifier must be returned together.' },
    )

export type AiChatMessage = z.infer<typeof chatMessageSchema>
export type AiHabitProposal = NonNullable<
    z.infer<typeof aiChatResponseSchema>['proposal']
>
export type AiAgentRequest = z.infer<typeof aiAgentRequestSchema>
export type AiAgentResponse = z.infer<typeof aiAgentResponseSchema>

const aiApi = createApi({ baseUrl: API_BASE_URL })

export const aiEndpoints = {
    streamChat: async (
        input: AiAgentRequest,
        signal?: AbortSignal,
    ): Promise<AiAgentResponse> => {
        const request = aiAgentRequestSchema.safeParse(input)
        if (!request.success)
            throw new AiChatError({
                stage: 'request',
                fields: request.error.issues.map(issue => issue.path.join('.')),
            })
        let token: string | null
        try {
            token = await getValidAccessToken()
        } catch (error) {
            throw new AiChatError({
                stage: 'authentication',
                status: isAxiosError(error)
                    ? error.response?.status
                    : undefined,
            })
        }
        if (!token) throw new AiChatError({ stage: 'authentication' })
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
        if (!timeZone)
            throw new AiChatError({ stage: 'request', fields: ['timeZone'] })
        const data = await requestAiChatStream({
            url: `${API_BASE_URL.replace(/\/+$/, '')}/ai/chat/stream`,
            token,
            body: { ...request.data, timeZone },
            signal,
        })
        const response = aiAgentResponseSchema.safeParse(data)
        if (!response.success)
            throw new AiChatError({
                stage: 'response',
                fields: response.error.issues.map(issue =>
                    issue.path.join('.'),
                ),
            })
        return response.data
    },
    decideProposal: async (
        proposalId: string,
        decision: 'accepted' | 'rejected',
    ): Promise<void> => {
        if (!z.uuid().safeParse(proposalId).success)
            throw new AiChatError({ stage: 'request', fields: ['proposalId'] })
        let token: string | null
        try {
            token = await getValidAccessToken()
        } catch (error) {
            throw new AiChatError({
                stage: 'authentication',
                status: isAxiosError(error)
                    ? error.response?.status
                    : undefined,
            })
        }
        if (!token) throw new AiChatError({ stage: 'authentication' })
        let data: unknown
        try {
            const response = await aiApi.post<unknown>(
                `/ai/proposals/${proposalId}/decision`,
                { decision },
                { headers: { Authorization: `Bearer ${token}` } },
            )
            data = response.data
        } catch (error) {
            throw new AiChatError({
                stage: 'proposal',
                status: isAxiosError(error)
                    ? error.response?.status
                    : undefined,
            })
        }
        const parsed = z.object({ status: z.literal(decision) }).safeParse(data)
        if (!parsed.success) throw new AiChatError({ stage: 'response' })
    },
}
