import { date, field, json } from '@nozbe/watermelondb/decorators'
import { Model } from '@nozbe/watermelondb'

import { sanitizeJson } from '../sanitizeJson'

export class Habit extends Model {
    static table = 'habits'

    @field('user_id') userId!: string
    @field('category_id') categoryId?: string
    @field('name') name!: string
    @field('description') description?: string
    @field('frequency_type') frequencyType!: string
    @json('week_days', sanitizeJson) weekDays!: number[]
    @field('estimated_duration_minutes') estimatedDurationMinutes?: number
    @date('preferred_time') preferredTime?: Date
    @field('priority') priority!: string
    @field('is_focus_of_day') isFocusOfDay!: boolean
    @field('status') status!: string
    @date('seasonal_start') seasonalStart?: Date
    @date('seasonal_end') seasonalEnd?: Date
    @date('created_at') createdAt?: Date
    @date('updated_at') updatedAt?: Date
}
