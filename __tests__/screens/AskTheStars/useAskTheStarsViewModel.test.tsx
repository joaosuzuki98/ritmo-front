import React from 'react'
import { act, create } from 'react-test-renderer'

import { database, type Habit } from '../../../src/database'
import { useAskTheStarsViewModel } from '../../../src/screens/AskTheStars/useAskTheStarsViewModel'
import type { HabitScheduleSuggestion } from '../../../src/habits/habitScheduleAnalysis'

jest.mock('../../../src/database', () => ({
    database: { get: jest.fn(), write: jest.fn() },
}))

type Observer = { next: (records: unknown[]) => void }

const mockedGet = database.get as jest.Mock
const mockedWrite = database.write as jest.Mock

describe('useAskTheStarsViewModel schedule acceptance', () => {
    let renderer: ReturnType<typeof create> | undefined
    let observers: Record<string, Observer>
    let storedHabit: Habit
    let viewModel: ReturnType<typeof useAskTheStarsViewModel>

    const Harness = () => {
        viewModel = useAskTheStarsViewModel('user-1', 'habit-1')
        return null
    }

    beforeEach(() => {
        jest.clearAllMocks()
        observers = {}
        const record = {
            id: 'habit-1',
            name: 'Read',
            status: 'pending',
            weekDays: [1],
            preferredTime: new Date(2026, 10, 7, 19),
            update: async (mutate: (habit: Habit) => void) => {
                mutate(record as unknown as Habit)
                return record
            },
        }
        storedHabit = record as unknown as Habit

        mockedGet.mockImplementation((table: string) => ({
            query: () => ({
                observeWithColumns: () => ({
                    subscribe: (observer: Observer) => {
                        observers[table] = observer
                        return { unsubscribe: jest.fn() }
                    },
                }),
            }),
            find: jest.fn(async () => storedHabit),
        }))
        mockedWrite.mockImplementation(
            async (operation: () => Promise<unknown>) => operation(),
        )
    })

    afterEach(() => {
        act(() => renderer?.unmount())
        renderer = undefined
    })

    it('saves both the suggested weekday and preferred time', async () => {
        await act(async () => {
            renderer = create(<Harness />)
        })
        act(() => observers.habits?.next([storedHabit]))
        act(() => observers.events?.next([]))
        act(() => observers.completion_records?.next([]))

        const suggestion: HabitScheduleSuggestion = {
            days: [2],
            time: new Date(2026, 10, 7, 17),
            successRate: 0.92,
            sampleCount: 13,
        }
        let accepted = false

        await act(async () => {
            accepted = await viewModel.acceptSuggestion(suggestion)
        })

        expect(accepted).toBe(true)
        expect(storedHabit.weekDays).toEqual([2])
        expect(storedHabit.preferredTime).toEqual(suggestion.time)
    })
})
