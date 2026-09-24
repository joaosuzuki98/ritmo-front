import { z } from 'zod'

const fullHour = /^([01]\d|2[0-3]):00$/

export const addScheduleItemSchema = z
    .object({
        endTime: z.string().regex(fullHour, 'Use a full hour, e.g. 09:00.'),
        startTime: z.string().regex(fullHour, 'Use a full hour, e.g. 08:00.'),
        title: z.string().trim().min(1, 'Give this item a name.'),
    })
    .refine(
        values =>
            Number(values.endTime.slice(0, 2)) >
            Number(values.startTime.slice(0, 2)),
        {
            message: 'End time must be after start time.',
            path: ['endTime'],
        },
    )

export type AddScheduleItemFormData = z.infer<typeof addScheduleItemSchema>
