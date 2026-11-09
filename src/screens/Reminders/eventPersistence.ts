import { Q } from '@nozbe/watermelondb'

import { database, type Event, type Habit } from '../../database'
import { findEventScheduleConflict } from '../../utils/scheduleConflict'

export type LocalEventInput = {
    title: string
    dateTime: Date
    endTime?: Date
    location?: string
    description?: string
    reminderType?: 'normal' | 'holiday' | 'important_day'
}

const assertNoConflict = async (
    userId: string,
    values: Pick<LocalEventInput, 'dateTime' | 'endTime'>,
    eventId?: string,
) => {
    const [events, habits] = await Promise.all([
        database.get<Event>('events').query(Q.where('user_id', userId)).fetch(),
        database.get<Habit>('habits').query(Q.where('user_id', userId)).fetch(),
    ])
    const conflict = findEventScheduleConflict(
        { id: eventId, ...values },
        events,
        habits,
    )
    if (conflict)
        throw new Error(`This time overlaps with “${conflict.title}”.`)
}

export const createEventLocally = async (
    userId: string,
    input: LocalEventInput,
) => {
    if (
        Number.isNaN(input.dateTime.getTime()) ||
        (input.endTime && Number.isNaN(input.endTime.getTime()))
    )
        throw new Error('The proposed event time is invalid.')
    await assertNoConflict(userId, input)
    return database.write(async () =>
        database.get<Event>('events').create(record => {
            record.userId = userId
            record.title = input.title.trim()
            record.dateTime = input.dateTime
            record.endTime = input.endTime
            record.location = input.location?.trim() || undefined
            record.description = input.description?.trim() || undefined
            record.recurrence = 'none'
            record.countdownEnabled = false
            record.conversionOrigin = 'reminders'
            record.reminderType = input.reminderType ?? 'normal'
        }),
    )
}

export const updateEventLocally = async (
    userId: string,
    eventId: string,
    changes: {
        title?: string
        dateTime?: Date
        endTime?: Date | null
        location?: string | null
        description?: string | null
        reminderType?: 'normal' | 'holiday' | 'important_day'
    },
) => {
    const event = await database
        .get<Event>('events')
        .find(eventId)
        .catch(() => null)
    if (!event || event.userId !== userId)
        throw new Error('Event is no longer available.')
    const dateTime = changes.dateTime ?? event.dateTime
    const endTime =
        changes.endTime === undefined
            ? event.endTime
            : changes.endTime ?? undefined
    if (
        Number.isNaN(dateTime.getTime()) ||
        (endTime && Number.isNaN(endTime.getTime()))
    )
        throw new Error('The proposed event time is invalid.')
    await assertNoConflict(userId, { dateTime, endTime }, event.id)
    const updatedAt = new Date()
    return database.write(async () =>
        event.update(record => {
            if (changes.title !== undefined) record.title = changes.title.trim()
            if (changes.dateTime !== undefined) record.dateTime = dateTime
            if (changes.endTime !== undefined) record.endTime = endTime
            if (changes.location !== undefined)
                record.location = changes.location?.trim() || undefined
            if (changes.description !== undefined)
                record.description = changes.description?.trim() || undefined
            if (changes.reminderType !== undefined)
                record.reminderType = changes.reminderType
            record.updatedAt = updatedAt
        }),
    )
}
