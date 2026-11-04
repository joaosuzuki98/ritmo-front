import { database, type User } from './index'
import { Q } from '@nozbe/watermelondb'
import type { Habit } from './models/Habit'
import { localDateKey } from '../utils/normalizeLocalDate'

export const registerDailyAccess = async (userId: string) => {
    const habits = await database
        .get<Habit>('habits')
        .query(
            Q.where('user_id', userId),
            Q.where('status', Q.notEq('deleted')),
        )
        .fetch()
    const hasHabits = habits.some(
        habit =>
            habit.userId === userId &&
            habit.status !== 'deleted' &&
            habit.name.trim().length > 0,
    )

    return database.write(async () => {
        // Read inside the writer so simultaneous foreground events count once.
        const user = await database.get<User>('users').find(userId)
        const date = localDateKey(new Date())
        const isFirstAccess = !user.lastAccessDate || user.lastAccessDate < date
        let totalAccessDays = user.totalAccessDays || 0

        if (isFirstAccess) {
            totalAccessDays += 1
            await user.update(record => {
                record.totalAccessDays = totalAccessDays
                record.lastAccessDate = date
            })
        }

        return { date, isFirstAccess, hasHabits, totalAccessDays }
    })
}
