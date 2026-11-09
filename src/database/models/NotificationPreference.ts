import { date, field } from '@nozbe/watermelondb/decorators'
import { Model } from '@nozbe/watermelondb'

export class NotificationPreference extends Model {
    static table = 'notification_preferences'

    @field('user_id') userId!: string
    @field('notify_habit_start') notifyHabitStart!: boolean
    @field('notify_daily_focus') notifyDailyFocus!: boolean
    @field('notify_priority_habits') notifyPriorityHabits!: boolean
    @field('notify_low_success_habits') notifyLowSuccessHabits?: boolean
    @field('notify_weekly_habit_load') notifyWeeklyHabitLoad?: boolean
    @field('pending_weekly_habit_load') pendingWeeklyHabitLoad?: boolean
    @field('minimum_priority') minimumPriority?: string
    @field('low_success_notification_state')
    lowSuccessNotificationState?: string
    @field('pending_habit_analysis_id') pendingHabitAnalysisId?: string
    @date('created_at') createdAt?: Date
    @date('updated_at') updatedAt?: Date
}
