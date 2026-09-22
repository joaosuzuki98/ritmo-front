import { date, field } from '@nozbe/watermelondb/decorators'
import { Model } from '@nozbe/watermelondb'

export class IncompletionReason extends Model {
    static table = 'incompletion_reasons'

    @field('description') description!: string
    @date('created_at') createdAt?: Date
    @date('updated_at') updatedAt?: Date
}
