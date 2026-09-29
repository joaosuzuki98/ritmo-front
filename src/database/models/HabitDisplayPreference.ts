import { date, field, json } from '@nozbe/watermelondb/decorators'
import { Model, Q } from '@nozbe/watermelondb'

import { sanitizeJson } from '../sanitizeJson'

export class HabitDisplayPreference extends Model {
    static table = 'habit_display_preferences'

    @field('user_id') userId!: string
    @field('week_day') weekDay!: number
    @json('ordered_habit_ids', sanitizeJson) orderedHabitIds!: string[]
    @date('created_at') createdAt?: Date
    @date('updated_at') updatedAt?: Date

    static lookup(userId: string, weekDay: number) {
        return [Q.where('user_id', userId), Q.where('week_day', weekDay)]
    }
}
