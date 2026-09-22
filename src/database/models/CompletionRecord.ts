import { date, field } from '@nozbe/watermelondb/decorators'
import { Model } from '@nozbe/watermelondb'

export class CompletionRecord extends Model {
    static table = 'completion_records'

    @field('habit_id') habitId!: string
    @date('date') date!: Date
    @field('status') status!: string
    @date('completion_time') completionTime?: Date
    @field('incompletion_reason_id') incompletionReasonId?: string
    @field('note') note?: string
    @field('distraction_lock_enabled') distractionLockEnabled!: boolean
    @date('created_at') createdAt?: Date
    @date('updated_at') updatedAt?: Date
}
