import { date, field } from '@nozbe/watermelondb/decorators'
import { Model } from '@nozbe/watermelondb'

export class EventSubtask extends Model {
    static table = 'event_subtasks'

    @field('event_id') eventId!: string
    @field('habit_id') habitId!: string
    @date('due_date') dueDate?: Date
    @date('created_at') createdAt?: Date
    @date('updated_at') updatedAt?: Date
}
