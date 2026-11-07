import { date, field } from '@nozbe/watermelondb/decorators'
import { Model } from '@nozbe/watermelondb'

export class NotificationPreference extends Model {
    static table = 'notification_preferences'

    @field('user_id') userId!: string
    @field('notify_habit_start') notifyHabitStart!: boolean
    @field('notify_daily_focus') notifyDailyFocus!: boolean
    @field('notify_priority_habits') notifyPriorityHabits!: boolean
    @field('minimum_priority') minimumPriority?: string
    @date('created_at') createdAt?: Date
    @date('updated_at') updatedAt?: Date
}
