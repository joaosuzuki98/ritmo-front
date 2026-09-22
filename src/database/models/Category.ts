import { date, field } from '@nozbe/watermelondb/decorators'
import { Model } from '@nozbe/watermelondb'

export class Category extends Model {
    static table = 'categories'

    @field('name') name!: string
    @field('user_id') userId!: string
    @date('created_at') createdAt?: Date
    @date('updated_at') updatedAt?: Date
}
