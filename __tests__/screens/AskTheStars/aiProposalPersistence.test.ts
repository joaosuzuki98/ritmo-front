jest.mock('../../../src/database', () => ({
    database: { get: jest.fn(), write: jest.fn() },
}))
jest.mock(
    '../../../src/screens/HabitsDashboard/useHabitsDashboardViewModel',
    () => ({
        completeAfterHabitChain: jest.fn(),
        updateHabitStreak: jest.fn(),
    }),
)
jest.mock('../../../src/utils/scheduleConflict', () => ({
    findEventScheduleConflict: jest.fn(() => null),
}))

import { database } from '../../../src/database'
import { applyAiProposalLocally } from '../../../src/screens/AskTheStars/aiProposalPersistence'
import {
    completeAfterHabitChain,
    updateHabitStreak,
} from '../../../src/screens/HabitsDashboard/useHabitsDashboardViewModel'

type RecordData = {
    id: string
    [key: string]: unknown
    update?: (mutate: (record: RecordData) => void) => Promise<void>
}
const mockGet = jest.mocked(database.get) as jest.Mock
const mockWrite = jest.mocked(database.write) as jest.Mock
const records: Record<string, RecordData[]> = {}
const tables = [
    'habits',
    'completion_records',
    'todo_categories',
    'todo_tasks',
    'events',
    'goals',
    'categories',
    'habit_dependencies',
    'habit_conditions',
]

describe('applyAiProposalLocally', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        tables.forEach(table => {
            records[table] = []
        })
        records.habits.push({
            id: 'h1',
            userId: 'user-1',
            name: 'Walk',
            frequencyType: 'daily',
            weekDays: [1, 2, 3, 4, 5, 6, 7],
            status: 'pending',
        })
        records.todo_categories.push({
            id: 'tc1',
            userId: 'user-1',
            name: 'Personal',
        })
        records.todo_tasks.push({
            id: 't1',
            userId: 'user-1',
            title: 'Old title',
            category: 'Personal',
            isComplete: false,
        })
        records.events.push({
            id: 'e1',
            userId: 'user-1',
            title: 'Old event',
            dateTime: new Date('2026-11-10T10:00:00Z'),
            endTime: new Date('2026-11-10T11:00:00Z'),
            recurrence: 'none',
            countdownEnabled: false,
            conversionOrigin: 'reminders',
        })
        records.goals.push({
            id: 'g1',
            habitId: 'h1',
            description: 'Old goal',
            targetValue: 10,
            currentValue: 2,
            status: 'in_progress',
        })
        tables.forEach(table =>
            records[table].forEach(record => {
                record.update = async mutate => mutate(record)
            }),
        )
        mockWrite.mockImplementation(
            async (operation: () => Promise<unknown>) => operation(),
        )
        mockGet.mockImplementation((table: string) => ({
            query: () => ({ fetch: async () => records[table] ?? [] }),
            find: async (id: string) => {
                const record = (records[table] ?? []).find(
                    item => item.id === id,
                )
                if (!record) throw new Error('Not found')
                return record
            },
            create: async (apply: (record: RecordData) => void) => {
                const record: RecordData = { id: `${table}-generated` }
                apply(record)
                record.update = async mutate => mutate(record)
                records[table].push(record)
                return record
            },
        }))
    })

    it('records completion locally and refreshes streak/dependency helpers', async () => {
        await applyAiProposalLocally('user-1', {
            type: 'habit.completion.create',
            habitId: 'h1',
            date: '2026-11-09',
            completionTime: '08:30',
            note: 'Done',
        })
        expect(records.completion_records[0]).toMatchObject({
            habitId: 'h1',
            status: 'completed',
            note: 'Done',
        })
        expect(updateHabitStreak).toHaveBeenCalledWith('h1', expect.any(Date))
        expect(completeAfterHabitChain).toHaveBeenCalledWith(
            'h1',
            'user-1',
            expect.any(Date),
            expect.any(Date),
        )
    })

    it('creates a task and uses its existing local category', async () => {
        await applyAiProposalLocally('user-1', {
            type: 'todo.create',
            task: { title: 'Buy food' },
        })
        expect(records.todo_tasks.at(-1)).toMatchObject({
            userId: 'user-1',
            title: 'Buy food',
            category: 'Personal',
            isComplete: false,
        })
    })

    it('creates a new task category locally when the AI suggests one that is absent', async () => {
        records.todo_categories.length = 0
        await applyAiProposalLocally('user-1', {
            type: 'todo.create',
            task: { title: 'Buy food', category: 'Errands' },
        })
        expect(records.todo_categories[0]).toMatchObject({
            userId: 'user-1',
            name: 'Errands',
        })
        expect(records.todo_tasks.at(-1)?.category).toBe('Errands')
    })

    it('updates only requested task fields and keeps ownership local', async () => {
        await applyAiProposalLocally('user-1', {
            type: 'todo.update',
            entityId: 't1',
            changes: { isComplete: true },
        })
        expect(records.todo_tasks[0].isComplete).toBe(true)
        await expect(
            applyAiProposalLocally('user-2', {
                type: 'todo.update',
                entityId: 't1',
                changes: { title: 'Nope' },
            }),
        ).rejects.toThrow('Task is no longer available.')
    })

    it('creates and updates events with native Date values and nullable clears', async () => {
        await applyAiProposalLocally('user-1', {
            type: 'event.create',
            event: {
                title: 'Visit',
                dateTime: '2026-11-10T10:00:00-03:00',
                endTime: '2026-11-10T11:00:00-03:00',
            },
        })
        expect(records.events.at(-1)?.dateTime).toBeInstanceOf(Date)
        await applyAiProposalLocally('user-1', {
            type: 'event.update',
            entityId: 'e1',
            changes: { endTime: null, location: null },
        })
        expect(records.events[0].endTime).toBeUndefined()
        expect(records.events[0].location).toBeUndefined()
    })

    it('creates goals with locally derived progress and updates existing goals', async () => {
        await applyAiProposalLocally('user-1', {
            type: 'goal.create',
            goal: {
                habitId: 'h1',
                description: 'Walk 20',
                targetValue: 20,
                deadlineType: 'short_term',
            },
        })
        expect(records.goals.at(-1)).toMatchObject({
            habitId: 'h1',
            currentValue: 0,
            status: 'in_progress',
        })
        await applyAiProposalLocally('user-1', {
            type: 'goal.update',
            entityId: 'g1',
            changes: { targetValue: 24 },
        })
        expect(records.goals[0]).toMatchObject({
            targetValue: 24,
            status: 'in_progress',
        })
    })

    it('rejects removed or foreign event and goal targets', async () => {
        await expect(
            applyAiProposalLocally('user-1', {
                type: 'event.update',
                entityId: 'missing',
                changes: { title: 'x' },
            }),
        ).rejects.toThrow('Event is no longer available.')
        records.habits[0].userId = 'other-user'
        await expect(
            applyAiProposalLocally('user-1', {
                type: 'goal.update',
                entityId: 'g1',
                changes: { targetValue: 4 },
            }),
        ).rejects.toThrow('Goal is no longer available.')
    })

    it('rejects a completion proposal for a habit owned by another user', async () => {
        records.habits[0].userId = 'other-user'
        await expect(
            applyAiProposalLocally('user-1', {
                type: 'habit.completion.create',
                habitId: 'h1',
                date: '2026-11-09',
            }),
        ).rejects.toThrow('Habit is no longer available.')
        expect(records.completion_records).toHaveLength(0)
    })
})
