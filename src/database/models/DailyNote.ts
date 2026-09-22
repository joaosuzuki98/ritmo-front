import { date, field } from '@nozbe/watermelondb/decorators'
import { Model } from '@nozbe/watermelondb'

export class DailyNote extends Model {
    static table = 'daily_notes'

    @field('user_id') userId!: string
    @date('date') date!: Date
    @field('text') text!: string
    @date('created_at') createdAt?: Date
    @date('updated_at') updatedAt?: Date
}
