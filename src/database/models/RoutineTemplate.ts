import { date, field, json } from '@nozbe/watermelondb/decorators'
import { Model } from '@nozbe/watermelondb'

import { sanitizeJson } from '../sanitizeJson'

export class RoutineTemplate extends Model {
    static table = 'routine_templates'

    @field('user_id') userId!: string
    @field('name') name!: string
    @json('included_habit_ids', sanitizeJson) includedHabitIds!: string[]
    @json('included_events', sanitizeJson) includedEvents!: unknown[]
    @date('created_at') createdAt?: Date
    @date('updated_at') updatedAt?: Date
}
