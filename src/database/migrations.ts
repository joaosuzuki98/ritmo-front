import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations'

export const databaseMigrations = schemaMigrations({
    migrations: [
        {
            toVersion: 2,
            steps: [
                {
                    type: 'create_table',
                    schema: {
                        name: 'habit_display_preferences',
                        columns: {
                            user_id: {
                                name: 'user_id',
                                type: 'string',
                                isIndexed: true,
                            },
                            week_day: {
                                name: 'week_day',
                                type: 'number',
                                isIndexed: true,
                            },
                            ordered_habit_ids: {
                                name: 'ordered_habit_ids',
                                type: 'string',
                            },
                            created_at: {
                                name: 'created_at',
                                type: 'number',
                                isOptional: true,
                            },
                            updated_at: {
                                name: 'updated_at',
                                type: 'number',
                                isOptional: true,
                            },
                        },
                        columnArray: [
                            {
                                name: 'user_id',
                                type: 'string',
                                isIndexed: true,
                            },
                            {
                                name: 'week_day',
                                type: 'number',
                                isIndexed: true,
                            },
                            { name: 'ordered_habit_ids', type: 'string' },
                            {
                                name: 'created_at',
                                type: 'number',
                                isOptional: true,
                            },
                            {
                                name: 'updated_at',
                                type: 'number',
                                isOptional: true,
                            },
                        ],
                    },
                },
            ],
        },
    ],
})
