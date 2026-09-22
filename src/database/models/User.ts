import { date, field } from '@nozbe/watermelondb/decorators'
import { Model } from '@nozbe/watermelondb'

export class User extends Model {
    static table = 'users'

    @field('name') name!: string
    @field('email') email!: string
    @field('total_points') totalPoints!: number
    @field('level') level!: number
    @date('created_at') createdAt?: Date
    @date('updated_at') updatedAt?: Date
}
