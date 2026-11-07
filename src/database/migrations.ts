import {
    schemaMigrations,
    unsafeExecuteSql,
} from '@nozbe/watermelondb/Schema/migrations'

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
        {
            toVersion: 3,
            steps: [
                {
                    type: 'add_columns',
                    table: 'events',
                    columns: [
                        {
                            name: 'end_time',
                            type: 'number',
                            isOptional: true,
                        },
                    ],
                },
            ],
        },
        {
            toVersion: 4,
            steps: [
                {
                    type: 'add_columns',
                    table: 'group_consistency_goals',
                    columns: [
                        {
                            name: 'description',
                            type: 'string',
                            isOptional: true,
                        },
                    ],
                },
            ],
        },
        {
            toVersion: 5,
            steps: [
                {
                    type: 'create_table',
                    schema: {
                        name: 'todo_tasks',
                        columns: {
                            user_id: {
                                name: 'user_id',
                                type: 'string',
                                isIndexed: true,
                            },
                            title: { name: 'title', type: 'string' },
                            category: {
                                name: 'category',
                                type: 'string',
                                isIndexed: true,
                            },
                            is_complete: {
                                name: 'is_complete',
                                type: 'boolean',
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
                            { name: 'title', type: 'string' },
                            {
                                name: 'category',
                                type: 'string',
                                isIndexed: true,
                            },
                            { name: 'is_complete', type: 'boolean' },
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
        {
            toVersion: 6,
            steps: [
                {
                    type: 'add_columns',
                    table: 'events',
                    columns: [
                        {
                            name: 'description',
                            type: 'string',
                            isOptional: true,
                        },
                    ],
                },
            ],
        },
        {
            toVersion: 7,
            steps: [
                {
                    type: 'create_table',
                    schema: {
                        name: 'todo_categories',
                        columns: {
                            user_id: {
                                name: 'user_id',
                                type: 'string',
                                isIndexed: true,
                            },
                            name: { name: 'name', type: 'string' },
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
                            { name: 'name', type: 'string' },
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
        {
            toVersion: 8,
            steps: [
                {
                    type: 'add_columns',
                    table: 'users',
                    columns: [
                        {
                            name: 'password',
                            type: 'string',
                            isOptional: true,
                        },
                        {
                            name: 'is_logged_in',
                            type: 'boolean',
                            isOptional: true,
                        },
                    ],
                },
            ],
        },
        {
            toVersion: 9,
            steps: [
                {
                    type: 'add_columns',
                    table: 'users',
                    columns: [
                        {
                            name: 'password_hash',
                            type: 'string',
                            isOptional: true,
                        },
                        {
                            name: 'password_salt',
                            type: 'string',
                            isOptional: true,
                        },
                    ],
                },
            ],
        },
        {
            toVersion: 10,
            steps: [
                {
                    type: 'add_columns',
                    table: 'events',
                    columns: [
                        {
                            name: 'reminder_type',
                            type: 'string',
                            isOptional: true,
                        },
                    ],
                },
            ],
        },
        {
            toVersion: 11,
            steps: [],
        },
        {
            toVersion: 12,
            steps: [
                {
                    type: 'add_columns',
                    table: 'users',
                    columns: [
                        {
                            name: 'mascot_name',
                            type: 'string',
                            isOptional: true,
                        },
                    ],
                },
            ],
        },
        {
            toVersion: 13,
            steps: [
                {
                    type: 'add_columns',
                    table: 'users',
                    columns: [
                        {
                            name: 'total_access_days',
                            type: 'number',
                            isOptional: true,
                        },
                        {
                            name: 'last_access_date',
                            type: 'string',
                            isOptional: true,
                        },
                    ],
                },
            ],
        },
        {
            toVersion: 14,
            steps: [
                unsafeExecuteSql('ALTER TABLE "users" DROP COLUMN "password";'),
                unsafeExecuteSql(
                    'ALTER TABLE "users" DROP COLUMN "password_hash";',
                ),
                unsafeExecuteSql(
                    'ALTER TABLE "users" DROP COLUMN "password_salt";',
                ),
            ],
        },
        {
            toVersion: 15,
            steps: [
                {
                    type: 'create_table',
                    schema: {
                        name: 'notification_preferences',
                        columns: {
                            user_id: {
                                name: 'user_id',
                                type: 'string',
                                isIndexed: true,
                            },
                            notify_habit_start: {
                                name: 'notify_habit_start',
                                type: 'boolean',
                            },
                            notify_daily_focus: {
                                name: 'notify_daily_focus',
                                type: 'boolean',
                            },
                            notify_priority_habits: {
                                name: 'notify_priority_habits',
                                type: 'boolean',
                            },
                            minimum_priority: {
                                name: 'minimum_priority',
                                type: 'string',
                                isOptional: true,
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
                            { name: 'notify_habit_start', type: 'boolean' },
                            { name: 'notify_daily_focus', type: 'boolean' },
                            {
                                name: 'notify_priority_habits',
                                type: 'boolean',
                            },
                            {
                                name: 'minimum_priority',
                                type: 'string',
                                isOptional: true,
                            },
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
        {
            toVersion: 16,
            steps: [
                {
                    type: 'add_columns',
                    table: 'notification_preferences',
                    columns: [
                        {
                            name: 'notify_low_success_habits',
                            type: 'boolean',
                            isOptional: true,
                        },
                        {
                            name: 'low_success_notification_state',
                            type: 'string',
                            isOptional: true,
                        },
                        {
                            name: 'pending_habit_analysis_id',
                            type: 'string',
                            isOptional: true,
                        },
                    ],
                },
            ],
        },
    ],
})
