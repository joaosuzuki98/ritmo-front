import { date, field } from '@nozbe/watermelondb/decorators'
import { Model } from '@nozbe/watermelondb'

export class TodoTask extends Model {
    static table = 'todo_tasks'

    @field('user_id') userId!: string
    @field('title') title!: string
    @field('category') category!: string
    @field('is_complete') isComplete!: boolean
    @date('created_at') createdAt?: Date
    @date('updated_at') updatedAt?: Date
}
