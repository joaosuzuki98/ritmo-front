import { z } from 'zod'

const hour = /^(?:[0-9]|0[0-9]|1[0-2])$/

const toMinutes = (
    value: string,
    minute: string,
    period: 'AM' | 'PM',
): number => {
    const hours = (Number(value) % 12) + (period === 'PM' ? 12 : 0)
    return hours * 60 + Number(minute)
}

export const addScheduleItemSchema = z
    .object({
        endHour: z.string().regex(hour, 'Enter an hour from 00 to 12.'),
        endMinute: z.string().regex(/^[0-5]\d$/, 'Enter a valid minute.'),
        endPeriod: z.enum(['AM', 'PM']),
        startHour: z.string().regex(hour, 'Enter an hour from 00 to 12.'),
        startMinute: z.string().regex(/^[0-5]\d$/, 'Enter a valid minute.'),
        startPeriod: z.enum(['AM', 'PM']),
        title: z.string().trim().min(1, 'Give this item a name.'),
        location: z.string().trim().optional(),
        description: z.string().trim().optional(),
        reminderType: z.enum(['normal', 'holiday', 'important_day']).optional(),
    })
    .refine(
        values =>
            toMinutes(values.endHour, values.endMinute, values.endPeriod) >
            toMinutes(values.startHour, values.startMinute, values.startPeriod),
        {
            message: 'End time must be after start time.',
            path: ['endHour'],
        },
    )

export type AddScheduleItemFormData = z.infer<typeof addScheduleItemSchema>
