import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'

import { Category } from './models/Category'
import { CompletionRecord } from './models/CompletionRecord'
import { DailyNote } from './models/DailyNote'
import { Event } from './models/Event'
import { EventSubtask } from './models/EventSubtask'
import { Goal } from './models/Goal'
import { GroupConsistencyGoal } from './models/GroupConsistencyGoal'
import { Habit } from './models/Habit'
import { HabitDisplayPreference } from './models/HabitDisplayPreference'
import { HabitCondition } from './models/HabitCondition'
import { HabitDependency } from './models/HabitDependency'
import { IncompletionReason } from './models/IncompletionReason'
import { Reminder } from './models/Reminder'
import { Reward } from './models/Reward'
import { RoutineTemplate } from './models/RoutineTemplate'
import { Streak } from './models/Streak'
import { TemporaryChallenge } from './models/TemporaryChallenge'
import { User } from './models/User'
import { databaseMigrations } from './migrations'
import { databaseSchema } from './schema'

const adapter = new SQLiteAdapter({
    dbName: 'ritmo',
    schema: databaseSchema,
    migrations: databaseMigrations,
    jsi: true,
})

export const database = new Database({
    adapter,
    modelClasses: [
        User,
        Category,
        Habit,
        HabitDisplayPreference,
        HabitDependency,
        HabitCondition,
        Event,
        EventSubtask,
        IncompletionReason,
        CompletionRecord,
        Streak,
        DailyNote,
        Goal,
        GroupConsistencyGoal,
        TemporaryChallenge,
        Reward,
        Reminder,
        RoutineTemplate,
    ],
})

export * from './models/Category'
export * from './models/CompletionRecord'
export * from './models/DailyNote'
export * from './models/Event'
export * from './models/EventSubtask'
export * from './models/Goal'
export * from './models/GroupConsistencyGoal'
export * from './models/Habit'
export * from './models/HabitDisplayPreference'
export * from './models/HabitCondition'
export * from './models/HabitDependency'
export * from './models/IncompletionReason'
export * from './models/Reminder'
export * from './models/Reward'
export * from './models/RoutineTemplate'
export * from './models/Streak'
export * from './models/TemporaryChallenge'
export * from './models/User'
