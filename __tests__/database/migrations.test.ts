import { databaseMigrations } from '../../src/database/migrations'
import { databaseSchema } from '../../src/database/schema'

describe('local account database migration', () => {
    it('adds device-local access tracking with a zero count for existing accounts', () => {
        const columns = [
            { name: 'total_access_days', type: 'number', isOptional: true },
            { name: 'last_access_date', type: 'string', isOptional: true },
        ]
        expect(
            databaseMigrations.sortedMigrations.find(
                item => item.toVersion === 13,
            )?.steps,
        ).toContainEqual({ type: 'add_columns', table: 'users', columns })
        expect(databaseSchema.tables.users.columnArray).toEqual(
            expect.arrayContaining(columns),
        )
    })
    it('adds credential columns for databases that already reached version 8', () => {
        const migration = databaseMigrations.sortedMigrations.find(
            item => item.toVersion === 9,
        )

        expect(databaseSchema.version).toBe(18)
        expect(migration?.steps).toContainEqual({
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
        })
    })

    it('removes local credential columns in version 14', () => {
        const migration = databaseMigrations.sortedMigrations.find(
            item => item.toVersion === 14,
        )

        expect(
            databaseSchema.tables.users.columnArray.map(column => column.name),
        ).not.toEqual(
            expect.arrayContaining([
                'password',
                'password_hash',
                'password_salt',
            ]),
        )
        expect(migration?.steps).toEqual([
            { type: 'sql', sql: 'ALTER TABLE "users" DROP COLUMN "password";' },
            {
                type: 'sql',
                sql: 'ALTER TABLE "users" DROP COLUMN "password_hash";',
            },
            {
                type: 'sql',
                sql: 'ALTER TABLE "users" DROP COLUMN "password_salt";',
            },
        ])
    })

    it('adds the reminder type column when migrating to version 10', () => {
        const migration = databaseMigrations.sortedMigrations.find(
            item => item.toVersion === 10,
        )
        expect(databaseSchema.tables.events.columnArray).toContainEqual({
            name: 'reminder_type',
            type: 'string',
            isOptional: true,
        })
        expect(migration?.steps).toContainEqual({
            type: 'add_columns',
            table: 'events',
            columns: [
                {
                    name: 'reminder_type',
                    type: 'string',
                    isOptional: true,
                },
            ],
        })
        expect(
            databaseMigrations.sortedMigrations.find(
                item => item.toVersion === 11,
            )?.steps,
        ).toEqual([])
    })

    it('adds an optional mascot name to existing user rows in version 12', () => {
        const migration = databaseMigrations.sortedMigrations.find(
            item => item.toVersion === 12,
        )

        expect(databaseSchema.tables.users.columnArray).toContainEqual({
            name: 'mascot_name',
            type: 'string',
            isOptional: true,
        })
        expect(migration?.steps).toContainEqual({
            type: 'add_columns',
            table: 'users',
            columns: [
                {
                    name: 'mascot_name',
                    type: 'string',
                    isOptional: true,
                },
            ],
        })
    })

    it('creates local notification preferences in version 15', () => {
        const migration = databaseMigrations.sortedMigrations.find(
            item => item.toVersion === 15,
        )

        expect(migration?.steps).toContainEqual(
            expect.objectContaining({
                type: 'create_table',
                schema: expect.objectContaining({
                    name: 'notification_preferences',
                }),
            }),
        )
        expect(
            databaseSchema.tables.notification_preferences.columnArray,
        ).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ name: 'user_id', type: 'string' }),
                expect.objectContaining({
                    name: 'notify_habit_start',
                    type: 'boolean',
                }),
                expect.objectContaining({
                    name: 'notify_daily_focus',
                    type: 'boolean',
                }),
                expect.objectContaining({
                    name: 'notify_priority_habits',
                    type: 'boolean',
                }),
            ]),
        )
    })

    it('adds low-success notification settings in version 16', () => {
        const migration = databaseMigrations.sortedMigrations.find(
            item => item.toVersion === 16,
        )

        expect(migration?.steps).toContainEqual({
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
            ],
        })
        expect(
            databaseSchema.tables.notification_preferences.columnArray,
        ).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: 'notify_low_success_habits',
                    type: 'boolean',
                    isOptional: true,
                }),
                expect.objectContaining({
                    name: 'low_success_notification_state',
                    type: 'string',
                    isOptional: true,
                }),
            ]),
        )
    })

    it('adds the pending habit-analysis route in version 17', () => {
        const migration = databaseMigrations.sortedMigrations.find(
            item => item.toVersion === 17,
        )

        expect(migration?.steps).toContainEqual({
            type: 'add_columns',
            table: 'notification_preferences',
            columns: [
                {
                    name: 'pending_habit_analysis_id',
                    type: 'string',
                    isOptional: true,
                },
            ],
        })
        expect(
            databaseSchema.tables.notification_preferences.columnArray,
        ).toContainEqual({
            name: 'pending_habit_analysis_id',
            type: 'string',
            isOptional: true,
        })
    })

    it('adds weekly habit-load notification fields in version 18', () => {
        const migration = databaseMigrations.sortedMigrations.find(
            item => item.toVersion === 18,
        )

        expect(migration?.steps).toContainEqual({
            type: 'add_columns',
            table: 'notification_preferences',
            columns: [
                {
                    name: 'notify_weekly_habit_load',
                    type: 'boolean',
                    isOptional: true,
                },
                {
                    name: 'pending_weekly_habit_load',
                    type: 'boolean',
                    isOptional: true,
                },
            ],
        })
        expect(
            databaseSchema.tables.notification_preferences.columnArray,
        ).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: 'notify_weekly_habit_load',
                    type: 'boolean',
                }),
                expect.objectContaining({
                    name: 'pending_weekly_habit_load',
                    type: 'boolean',
                }),
            ]),
        )
    })
})
