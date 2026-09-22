import { date, field } from '@nozbe/watermelondb/decorators'
import { Model } from '@nozbe/watermelondb'

export class HabitDependency extends Model {
    static table = 'habit_dependencies'

    @field('habit_id') habitId!: string
    @field('trigger_habit_id') triggerHabitId!: string
    @field('type') type!: string
    @date('created_at') createdAt?: Date
    @date('updated_at') updatedAt?: Date
}
