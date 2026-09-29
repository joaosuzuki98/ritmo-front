import { z } from 'zod'

import { goalTerms } from './goalUtils'

export const addGoalSchema = z
    .object({
        goalType: z.enum(['habit', 'group']),
        habitId: z.string(),
        includedHabitIds: z.array(z.string()),
        term: z.enum(goalTerms),
        description: z.string().trim().min(1, 'Add a goal description.'),
        targetValue: z
            .string()
            .regex(/^\d+$/, 'Enter a whole number.')
            .refine(
                value => Number(value) > 0,
                'Target must be greater than zero.',
            ),
        targetPercentage: z
            .string()
            .regex(/^\d+$/, 'Enter a whole percentage.')
            .refine(
                value => Number(value) >= 1 && Number(value) <= 100,
                'Choose a percentage from 1 to 100.',
            ),
    })
    .superRefine((data, context) => {
        if (data.goalType === 'habit' && !data.habitId)
            context.addIssue({
                code: 'custom',
                message: 'Choose a habit for this goal.',
                path: ['habitId'],
            })
        if (data.goalType === 'group' && data.includedHabitIds.length < 2)
            context.addIssue({
                code: 'custom',
                message: 'Choose at least two habits for a group goal.',
                path: ['includedHabitIds'],
            })
    })

export type AddGoalFormData = z.infer<typeof addGoalSchema>
