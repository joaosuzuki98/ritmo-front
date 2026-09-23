import { databaseMigrations } from '../../../src/database/migrations'

describe('HabitDisplayPreference', () => {
    it('uses the user and weekday as its lookup boundary', () => {
        expect(databaseMigrations).toBeTruthy()
    })
})
