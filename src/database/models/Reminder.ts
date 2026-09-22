import { date, field } from '@nozbe/watermelondb/decorators'
import { Model } from '@nozbe/watermelondb'

export class Reminder extends Model {
    static table = 'reminders'

    @field('habit_id') habitId?: string
    @field('event_id') eventId?: string
    @field('type') type!: string
    @date('calculated_time') calculatedTime?: Date
    @field('geofence_lat') geofenceLat?: number
    @field('geofence_lng') geofenceLng?: number
    @field('geofence_radius_m') geofenceRadiusMeters?: number
    @date('sent_at') sentAt?: Date
    @date('created_at') createdAt?: Date
    @date('updated_at') updatedAt?: Date
}
