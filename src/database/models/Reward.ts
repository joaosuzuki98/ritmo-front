import { date, field } from '@nozbe/watermelondb/decorators'
import { Model } from '@nozbe/watermelondb'

export class Reward extends Model {
    static table = 'rewards'

    @field('user_id') userId!: string
    @field('goal_id') goalId?: string
    @field('description') description!: string
    @field('redeemed') redeemed!: boolean
    @date('redeemed_at') redeemedAt?: Date
    @date('created_at') createdAt?: Date
    @date('updated_at') updatedAt?: Date
}
