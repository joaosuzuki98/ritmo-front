import { z } from 'zod'

import { incompletionReasonCodes } from '../../constants/incompletionReasons'

export const logHabitProgressSchema = z
    .object({
        status: z.enum(['completed', 'partial', 'skipped']),
        time: z
            .string()
            .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM format.'),
        reason: z.enum(incompletionReasonCodes).optional(),
        note: z.string().trim().max(1000, 'Keep notes under 1000 characters.'),
    })
    .superRefine((data, context) => {
        if (data.status !== 'completed' && !data.reason) {
            context.addIssue({
                code: 'custom',
                message: 'Choose a reason for not completing this habit.',
                path: ['reason'],
            })
        }
    })

export type LogHabitProgressFormData = z.infer<typeof logHabitProgressSchema>
