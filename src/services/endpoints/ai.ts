import { z } from 'zod'
import { isAxiosError } from 'axios'

import { habitStatusCodes } from '../../constants/habitStatuses'
import { priorityCodes } from '../../constants/priorities'
import { API_BASE_URL } from '../../constants/api'
import { createApi } from '../api'
import { getValidAccessToken } from '../authSession'
import { AiChatError } from '../aiChatError'

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

const chatHabitSchema = z.object({
    id: z.string(),
    name: z.string(),
    frequencyType: z.enum(['daily', 'weekly']),
    description: z.string().optional(),
    weekDays: weekDaysSchema.optional(),
    estimatedDurationMinutes: durationSchema.optional(),
    preferredTime: preferredTimeSchema.optional(),
    priority: z.enum(priorityCodes).optional(),
    status: z.enum(habitStatusCodes).optional(),
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

export const aiChatRequestSchema = z.object({
    message: z.string().trim().min(1).max(2000),
    history: z.array(chatMessageSchema).max(10).optional(),
    context: z
        .object({
            habits: z.array(chatHabitSchema).max(30),
        })
        .optional(),
})

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
        ])
        .nullable(),
})

export type AiChatMessage = z.infer<typeof chatMessageSchema>
export type AiChatHabit = z.infer<typeof chatHabitSchema>
export type AiHabitProposal = NonNullable<
    z.infer<typeof aiChatResponseSchema>['proposal']
>
export type AiChatRequest = z.infer<typeof aiChatRequestSchema>
export type AiChatResponse = z.infer<typeof aiChatResponseSchema>

const aiApi = createApi({ baseUrl: API_BASE_URL })

export const aiEndpoints = {
    chat: async (input: AiChatRequest): Promise<AiChatResponse> => {
        const request = aiChatRequestSchema.safeParse(input)
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

        let responseData: unknown
        try {
            const response = await aiApi.post<unknown>(
                '/ai/chat',
                request.data,
                {
                    headers: { Authorization: `Bearer ${token}` },
                },
            )
            responseData = response.data
        } catch (error) {
            throw new AiChatError({
                stage: 'http',
                status: isAxiosError(error)
                    ? error.response?.status
                    : undefined,
            })
        }

        const response = aiChatResponseSchema.safeParse(responseData)
        if (!response.success)
            throw new AiChatError({
                stage: 'response',
                fields: response.error.issues.map(issue =>
                    issue.path.join('.'),
                ),
            })
        return response.data
    },
}
