import { date, field } from '@nozbe/watermelondb/decorators'
import { Model } from '@nozbe/watermelondb'

export class Goal extends Model {
    static table = 'goals'

    @field('habit_id') habitId!: string
    @field('deadline_type') deadlineType!: string
    @field('description') description!: string
    @field('target_value') targetValue!: number
    @field('current_value') currentValue!: number
    @field('status') status!: string
    @date('created_at') createdAt?: Date
    @date('updated_at') updatedAt?: Date
}
