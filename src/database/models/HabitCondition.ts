import { date, field, json } from '@nozbe/watermelondb/decorators'
import { Model } from '@nozbe/watermelondb'

import { sanitizeJson } from '../sanitizeJson'

export class HabitCondition extends Model {
    static table = 'habit_conditions'

    @field('habit_id') habitId!: string
    @field('condition_habit_id') conditionHabitId!: string
    @json('condition_rule', sanitizeJson) conditionRule!: unknown
    @field('condition_type') conditionType?: string
    @date('created_at') createdAt?: Date
    @date('updated_at') updatedAt?: Date
}
