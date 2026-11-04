import React from 'react'
import { AccessibilityInfo } from 'react-native'
import { act, create } from 'react-test-renderer'

import { database, type Habit } from '../../../src/database'
import { useHabitsDashboardViewModel } from '../../../src/screens/HabitsDashboard/useHabitsDashboardViewModel'

jest.mock('../../../src/database', () => ({
    database: { get: jest.fn() },
}))

type FocusObserver = { next: (habits: Habit[]) => void }

const mockedGet = database.get as jest.Mock

describe('useHabitsDashboardViewModel focus reactivity', () => {
    let viewModel: ReturnType<typeof useHabitsDashboardViewModel>
    let habit: Habit
    let focusObserver: FocusObserver | undefined
    let observedColumns: string[]
    let unsubscribe: jest.Mock
    let renderer: ReturnType<typeof create> | undefined

    const Harness = () => {
        viewModel = useHabitsDashboardViewModel('local-user')
        return null
    }

    beforeEach(() => {
        jest.clearAllMocks()
        focusObserver = undefined
        observedColumns = []
        unsubscribe = jest.fn()
        habit = {
            id: 'habit-1',
            userId: 'local-user',
            name: 'Read',
            description: '',
            frequencyType: 'daily',
            weekDays: [1, 2, 3, 4, 5, 6, 7],
            priority: 'medium',
            status: 'pending',
            isFocusOfDay: false,
        } as Habit

        jest.spyOn(
            AccessibilityInfo,
            'isReduceMotionEnabled',
        ).mockResolvedValue(false)
        jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({
            remove: jest.fn(),
        })

        mockedGet.mockImplementation((tableName: string) => ({
            query: () => ({
                fetch: async () => (tableName === 'habits' ? [habit] : []),
                observeWithColumns: (columns: string[]) => {
                    observedColumns = columns
                    return {
                        subscribe: (observer: FocusObserver) => {
                            focusObserver = observer
                            observer.next([habit])
                            return { unsubscribe }
                        },
                    }
                },
            }),
            find: async () => null,
        }))
    })

    afterEach(() => {
        if (renderer) act(() => renderer?.unmount())
        renderer = undefined
        jest.restoreAllMocks()
    })

    it('updates an already-loaded card when its focus flag changes in WatermelonDB', async () => {
        await act(async () => {
            renderer = create(<Harness />)
        })

        expect(viewModel.cards[0].isFocusOfDay).toBe(false)
        expect(observedColumns).toEqual(['is_focus_of_day'])

        habit = { ...habit, isFocusOfDay: true } as Habit
        act(() => focusObserver?.next([habit]))

        expect(viewModel.cards[0].isFocusOfDay).toBe(true)
    })
})
