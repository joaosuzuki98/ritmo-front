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
    ],
})
