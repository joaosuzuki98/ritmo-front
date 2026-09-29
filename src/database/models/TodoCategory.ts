import { date, field } from '@nozbe/watermelondb/decorators'
import { Model } from '@nozbe/watermelondb'

export class TodoCategory extends Model {
    static table = 'todo_categories'

    @field('user_id') userId!: string
    @field('name') name!: string
    @date('created_at') createdAt?: Date
    @date('updated_at') updatedAt?: Date
}
