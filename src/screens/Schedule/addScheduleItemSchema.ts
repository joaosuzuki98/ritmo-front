import { z } from 'zod'

const hour = /^(?:[0-9]|0[0-9]|1[0-2])$/

const toMinutes = (value: string, period: 'AM' | 'PM'): number => {
    const hours = (Number(value) % 12) + (period === 'PM' ? 12 : 0)
    return hours * 60
}

export const addScheduleItemSchema = z
    .object({
        endHour: z.string().regex(hour, 'Enter an hour from 00 to 12.'),
        endPeriod: z.enum(['AM', 'PM']),
        startHour: z.string().regex(hour, 'Enter an hour from 00 to 12.'),
        startPeriod: z.enum(['AM', 'PM']),
        title: z.string().trim().min(1, 'Give this item a name.'),
        location: z.string().trim().optional(),
        description: z.string().trim().optional(),
        reminderType: z.enum(['normal', 'holiday', 'important_day']).optional(),
    })
    .refine(
        values =>
            toMinutes(values.endHour, values.endPeriod) >
            toMinutes(values.startHour, values.startPeriod),
        {
            message: 'End time must be after start time.',
            path: ['endHour'],
        },
    )

export type AddScheduleItemFormData = z.infer<typeof addScheduleItemSchema>
