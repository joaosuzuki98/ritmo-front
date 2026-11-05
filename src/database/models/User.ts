import { date, field } from '@nozbe/watermelondb/decorators'
import { Model } from '@nozbe/watermelondb'

export class User extends Model {
    static table = 'users'

    @field('name') name!: string
    @field('mascot_name') mascotName?: string
    @field('email') email!: string
    @field('total_points') totalPoints!: number
    @field('level') level!: number
    @field('is_logged_in') isLoggedIn?: boolean
    @field('total_access_days') totalAccessDays?: number
    @field('last_access_date') lastAccessDate?: string
    @date('created_at') createdAt?: Date
    @date('updated_at') updatedAt?: Date
}
