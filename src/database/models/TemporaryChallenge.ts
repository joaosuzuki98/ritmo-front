import { date, field } from '@nozbe/watermelondb/decorators'
import { Model } from '@nozbe/watermelondb'

export class TemporaryChallenge extends Model {
    static table = 'temporary_challenges'

    @field('habit_id') habitId!: string
    @field('duration_days') durationDays!: number
    @date('start_date') startDate!: Date
    @field('status') status!: string
    @date('created_at') createdAt?: Date
    @date('updated_at') updatedAt?: Date
}
