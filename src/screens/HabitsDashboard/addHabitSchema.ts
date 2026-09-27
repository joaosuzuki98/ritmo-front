import { z } from 'zod'

import { habitRequirementStatuses } from '../../constants/habitRequirementStatuses'

export const addHabitSchema = z
    .object({
        name: z.string().trim().min(1, 'Give your habit a name.'),
        description: z.string().trim().optional(),
        categoryName: z.string().trim().optional(),
        frequencyType: z.enum(['daily', 'weekly']),
        weekDays: z.array(z.number()).min(1, 'Choose at least one day.'),
        priority: z.enum(['low', 'medium', 'high']),
        estimatedDurationMinutes: z
            .string()
            .refine(value => value.trim() === '' || /^\d+$/.test(value), {
                message: 'Use minutes as a whole number.',
            })
            .refine(value => value.trim() === '' || Number(value) > 0, {
                message: 'Duration must be greater than zero.',
            }),
        preferredTime: z
            .string()
            .refine(
                value =>
                    value.trim() === '' ||
                    /^([01]\d|2[0-3]):[0-5]\d$/.test(value),
                {
                    message: 'Use the HH:MM format.',
                },
            ),
        isFocusOfDay: z.boolean(),
        dependencyHabitId: z.string(),
        conditionHabitId: z.string(),
        conditionStatus: z.enum(habitRequirementStatuses).or(z.literal('')),
    })
    .superRefine((data, context) => {
        if (Boolean(data.conditionHabitId) !== Boolean(data.conditionStatus)) {
            context.addIssue({
                code: 'custom',
                message: 'Select a habit and its required status.',
                path: ['conditionStatus'],
            })
        }
        if (
            data.dependencyHabitId &&
            data.dependencyHabitId === data.conditionHabitId
        ) {
            context.addIssue({
                code: 'custom',
                message: 'Choose different habits for each requirement.',
                path: ['conditionHabitId'],
            })
        }
    })

export type AddHabitFormData = z.infer<typeof addHabitSchema>
