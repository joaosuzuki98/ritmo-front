import React from 'react'
import { AccessibilityInfo } from 'react-native'
import { act, create } from 'react-test-renderer'

import { database, type Habit } from '../../../src/database'
import type { WeekDay } from '../../../src/constants/weekDays'
import { useHabitsDashboardViewModel } from '../../../src/screens/HabitsDashboard/useHabitsDashboardViewModel'

jest.mock('../../../src/database', () => ({
    database: { get: jest.fn() },
}))

type FocusObserver = { next: (habits: Habit[]) => void }

const mockedGet = database.get as jest.Mock

describe('useHabitsDashboardViewModel reactivity', () => {
    let viewModel: ReturnType<typeof useHabitsDashboardViewModel>
    let habit: Habit
    let focusObserver: FocusObserver | undefined
    let scheduleObserver: FocusObserver | undefined
    let observedColumns: string[]
    let unsubscribe: jest.Mock
    let renderer: ReturnType<typeof create> | undefined

    const Harness = ({ initialWeekDay }: { initialWeekDay?: WeekDay }) => {
        viewModel = useHabitsDashboardViewModel('local-user', initialWeekDay)
        return null
    }

    beforeEach(() => {
        jest.clearAllMocks()
        focusObserver = undefined
        scheduleObserver = undefined
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
                    if (columns.includes('is_focus_of_day'))
                        observedColumns = columns
                    return {
                        subscribe: (observer: FocusObserver) => {
                            if (columns.includes('is_focus_of_day'))
                                focusObserver = observer
                            if (
                                columns.includes('week_days') &&
                                columns.includes('preferred_time')
                            )
                                scheduleObserver = observer
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

    it('selects a newly requested weekday when returning to the dashboard', async () => {
        await act(async () => {
            renderer = create(<Harness initialWeekDay={1} />)
        })

        expect(viewModel.weekDay).toBe(1)
        await act(async () => {
            renderer?.update(<Harness initialWeekDay={2} />)
        })

        expect(viewModel.weekDay).toBe(2)
        expect(viewModel.selectedDate.getDay()).toBe(2)
    })

    it('updates the preferred time without changing the selected weekday', async () => {
        habit.preferredTime = new Date(2026, 10, 7, 8)
        await act(async () => {
            renderer = create(<Harness initialWeekDay={2} />)
        })
        expect(viewModel.cards[0].preferredTime?.getHours()).toBe(8)

        await act(async () => {
            // WatermelonDB mutates existing model instances in place.
            habit.preferredTime = new Date(2026, 10, 7, 17)
            scheduleObserver?.next([habit])
        })

        expect(viewModel.weekDay).toBe(2)
        expect(viewModel.cards[0].preferredTime?.getHours()).toBe(17)
        expect(viewModel.visibleCards[0].preferredTime?.getHours()).toBe(17)
    })

    it('removes and restores a rescheduled habit on the current day', async () => {
        habit.weekDays = [1]
        await act(async () => {
            renderer = create(<Harness initialWeekDay={1} />)
        })
        expect(viewModel.visibleCards).toHaveLength(1)

        await act(async () => {
            habit.weekDays = [2]
            scheduleObserver?.next([habit])
        })
        expect(viewModel.weekDay).toBe(1)
        expect(viewModel.visibleCards).toHaveLength(0)
        expect(viewModel.state).toBe('empty')

        await act(async () => {
            habit.weekDays = [1]
            habit.preferredTime = new Date(2026, 10, 7, 17)
            scheduleObserver?.next([habit])
        })
        expect(viewModel.state).toBe('success')
        expect(viewModel.visibleCards[0].preferredTime?.getHours()).toBe(17)
    })
})
