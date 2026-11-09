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

const statisticsRatioSchema = z.number().min(0).max(1).nullable()
const statisticsPeriodSchema = z.object({
    label: z.string(),
    planned: z.number().int().nonnegative(),
    completed: z.number().int().nonnegative(),
    completionRate: statisticsRatioSchema,
})
const statisticsSchema = z.object({
    periods: z.array(statisticsPeriodSchema).optional(),
    habits: z
        .array(
            z.object({
                habitId: z.string(),
                name: z.string(),
                planned: z.number().int().nonnegative(),
                completed: z.number().int().nonnegative(),
                completionRate: statisticsRatioSchema,
                currentStreak: z.number().int().nonnegative(),
                longestStreak: z.number().int().nonnegative(),
                nextStreakMilestone: z.number().int().positive().nullable(),
                periods: z.array(statisticsPeriodSchema).optional(),
            }),
        )
        .optional(),
    weekdays: z
        .array(
            z.object({
                weekDay: z.number().int().min(1).max(7),
                planned: z.number().int().nonnegative(),
                completed: z.number().int().nonnegative(),
                completionRate: statisticsRatioSchema,
            }),
        )
        .optional(),
    timeOfDay: z.array(statisticsPeriodSchema).optional(),
    incompletionReasons: z
        .array(
            z.object({
                reason: z.string(),
                count: z.number().int().nonnegative(),
            }),
        )
        .optional(),
    categories: z
        .array(
            z.object({
                name: z.string(),
                habitCount: z.number().int().nonnegative(),
                completionRate: statisticsRatioSchema,
            }),
        )
        .optional(),
    weeklyLoad: z
        .object({
            plannedSessions: z.number().int().nonnegative(),
            estimatedMinutes: z.number().nonnegative(),
            completionRate: statisticsRatioSchema,
        })
        .optional(),
    goals: z
        .array(
            z.object({
                goalId: z.string(),
                habitId: z.string(),
                description: z.string(),
                targetValue: z.number(),
                currentValue: z.number(),
                remainingValue: z.number(),
                recentPacePerWeek: z.number().nullable(),
                projectedCompletionDate: z.string().nullable(),
                deadlineType: z.string(),
                status: z.string(),
            }),
        )
        .optional(),
    correlations: z
        .array(
            z.object({
                habitA: z.string(),
                habitB: z.string(),
                coefficient: z.number().min(-1).max(1),
                sampleSize: z.number().int().nonnegative(),
            }),
        )
        .optional(),
})

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

export const aiChatRequestSchema = z.object({
    message: z.string().trim().min(1).max(2000),
    mode: z.enum(['chat', 'statistics']).optional(),
    history: z.array(chatMessageSchema).max(10).optional(),
    context: z
        .object({
            habits: z.array(chatHabitSchema).max(30),
            statistics: statisticsSchema.optional(),
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

export type AiChatMessage = z.infer<typeof chatMessageSchema>
export type AiChatHabit = z.infer<typeof chatHabitSchema>
export type AiChatStatistics = z.infer<typeof statisticsSchema>
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
