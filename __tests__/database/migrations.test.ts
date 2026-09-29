import { databaseMigrations } from '../../src/database/migrations'
import { databaseSchema } from '../../src/database/schema'

describe('local account database migration', () => {
    it('adds credential columns for databases that already reached version 8', () => {
        const migration = databaseMigrations.sortedMigrations.find(
            item => item.toVersion === 9,
        )

        expect(databaseSchema.version).toBe(11)
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
})
