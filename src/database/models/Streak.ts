import { date, field } from '@nozbe/watermelondb/decorators'
import { Model } from '@nozbe/watermelondb'

export class Streak extends Model {
    static table = 'streaks'

    @field('habit_id') habitId!: string
    @field('current_streak') currentStreak!: number
    @field('longest_streak') longestStreak!: number
    @date('updated_at') updatedAt?: Date
}
