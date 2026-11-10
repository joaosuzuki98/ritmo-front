jest.mock('../../../src/database', () => ({
    database: { get: jest.fn(), write: jest.fn() },
}))

import { database, type Habit } from '../../../src/database'
import { createHabitLocally } from '../../../src/screens/HabitsDashboard/habitPersistence'
import type { AddHabitFormData } from '../../../src/screens/HabitsDashboard/addHabitSchema'
import { toCreateHabitFormData } from '../../../src/screens/AskTheStars/aiChatUtils'

const mockGet = database.get as jest.Mock
const mockWrite = database.write as jest.Mock
const mockCreate = jest.fn()
const mockCreateCategory = jest.fn()
const mockFetchCategories = jest.fn()

const formData: AddHabitFormData = {
    name: 'Walking',
    description: '',
    categoryName: '',
    frequencyType: 'daily',
    weekDays: [3],
    priority: 'medium',
    estimatedDurationMinutes: '',
    preferredTime: '',
    dependencyHabitId: '',
    conditionHabitId: '',
    conditionStatus: '',
}

describe('createHabitLocally', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockFetchCategories.mockResolvedValue([])
        mockCreateCategory.mockImplementation(
            async (apply: (record: Record<string, unknown>) => void) => {
                const record: Record<string, unknown> = {
                    id: 'watermelon-category-id',
                }
                apply(record)
                return record
            },
        )
        mockWrite.mockImplementation(
            async (operation: () => Promise<unknown>) => operation(),
        )
        mockCreate.mockImplementation(
            async (apply: (record: Record<string, unknown>) => void) => {
                const record: Record<string, unknown> = {
                    id: 'watermelon-generated-id',
                }
                apply(record)
                return record as unknown as Habit
            },
        )
        mockGet.mockImplementation((table: string) => {
            if (table === 'habits') return { create: mockCreate }
            if (table === 'categories')
                return {
                    create: mockCreateCategory,
                    query: () => ({ fetch: mockFetchCategories }),
                }
            return {
                query: () => ({ fetch: async () => [] }),
            }
        })
    })

    it('creates a local WatermelonDB habit with the form defaults and generated ID', async () => {
        const habit = await createHabitLocally('user-1', formData)

        expect(habit.id).toBe('watermelon-generated-id')
        expect(habit.userId).toBe('user-1')
        expect(habit.weekDays).toEqual([1, 2, 3, 4, 5, 6, 7])
        expect(habit.priority).toBe('medium')
        expect(habit.status).toBe('pending')
        expect(habit.isFocusOfDay).toBe(false)
        expect(mockWrite).toHaveBeenCalledTimes(1)
        expect(mockCreate).toHaveBeenCalledTimes(1)
    })

    it('rejects invalid form data without writing to WatermelonDB', async () => {
        await expect(
            createHabitLocally('user-1', { ...formData, name: '  ' }),
        ).rejects.toThrow()

        expect(mockWrite).not.toHaveBeenCalled()
    })

    const createFromProposal = (categoryName?: string) =>
        createHabitLocally(
            'user-1',
            toCreateHabitFormData(
                {
                    type: 'habit.create',
                    habit: {
                        name: 'Caminhada',
                        frequencyType: 'daily',
                        ...(categoryName === undefined ? {} : { categoryName }),
                    },
                },
                3,
            ),
        )

    it('creates a proposed habit without a category when none was suggested', async () => {
        const habit = await createFromProposal()

        expect(habit.categoryId).toBeUndefined()
        expect(habit.id).toBe('watermelon-generated-id')
        expect(mockFetchCategories).not.toHaveBeenCalled()
        expect(mockCreateCategory).not.toHaveBeenCalled()
    })

    it('reuses the matching category belonging to the current user', async () => {
        mockFetchCategories.mockResolvedValue([
            { id: 'other-user-category', userId: 'user-2', name: 'Saúde' },
            { id: 'existing-category', userId: 'user-1', name: 'saúde' },
        ])

        const habit = await createFromProposal('Saúde')

        expect(habit.categoryId).toBe('existing-category')
        expect(mockCreateCategory).not.toHaveBeenCalled()
        expect(mockWrite).toHaveBeenCalledTimes(1)
    })

    it('creates a local category when the suggested name exists only for another user', async () => {
        mockFetchCategories.mockResolvedValue([
            { id: 'other-user-category', userId: 'user-2', name: 'Saúde' },
        ])

        const habit = await createFromProposal('Saúde')

        expect(mockCreateCategory).toHaveBeenCalledTimes(1)
        await expect(mockCreateCategory.mock.results[0].value).resolves.toEqual(
            {
                id: 'watermelon-category-id',
                userId: 'user-1',
                name: 'Saúde',
            },
        )
        expect(habit.categoryId).toBe('watermelon-category-id')
        expect(habit.id).toBe('watermelon-generated-id')
        expect(mockWrite).toHaveBeenCalledTimes(1)
    })
})
