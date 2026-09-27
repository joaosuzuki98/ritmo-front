import { date, field } from '@nozbe/watermelondb/decorators'
import { Model } from '@nozbe/watermelondb'

export class User extends Model {
    static table = 'users'

    @field('name') name!: string
    @field('email') email!: string
    @field('password') password?: string
    @field('password_hash') passwordHash?: string
    @field('password_salt') passwordSalt?: string
    @field('total_points') totalPoints!: number
    @field('level') level!: number
    @field('is_logged_in') isLoggedIn?: boolean
    @date('created_at') createdAt?: Date
    @date('updated_at') updatedAt?: Date
}
