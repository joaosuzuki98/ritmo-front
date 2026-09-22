import { date, field } from '@nozbe/watermelondb/decorators'
import { Model } from '@nozbe/watermelondb'

export class Event extends Model {
    static table = 'events'

    @field('user_id') userId!: string
    @field('title') title!: string
    @date('date_time') dateTime!: Date
    @field('location') location?: string
    @field('recurrence') recurrence!: string
    @field('notification_minutes_before') notificationMinutesBefore?: number
    @field('countdown_enabled') countdownEnabled!: boolean
    @field('conversion_origin') conversionOrigin!: string
    @date('created_at') createdAt?: Date
    @date('updated_at') updatedAt?: Date
}
