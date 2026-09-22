import { date, field, json } from '@nozbe/watermelondb/decorators'
import { Model } from '@nozbe/watermelondb'

import { sanitizeJson } from '../sanitizeJson'

export class GroupConsistencyGoal extends Model {
    static table = 'group_consistency_goals'

    @field('user_id') userId!: string
    @field('target_percentage') targetPercentage!: number
    @json('included_habit_ids', sanitizeJson) includedHabitIds!: string[]
    @date('period_start') periodStart!: Date
    @date('period_end') periodEnd!: Date
    @date('created_at') createdAt?: Date
    @date('updated_at') updatedAt?: Date
}
