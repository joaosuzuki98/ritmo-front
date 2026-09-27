import React from 'react'
import { act, create } from 'react-test-renderer'

import { database, type Event } from '../../../src/database'
import { useScheduleViewModel } from '../../../src/screens/Schedule/useScheduleViewModel'

jest.mock('../../../src/database', () => ({
    database: { get: jest.fn() },
}))

type TableName = 'events' | 'habits'
type Observer = { next: (records: unknown[]) => void }

const mockedGet = database.get as jest.Mock

describe('useScheduleViewModel reactivity', () => {
    let viewModel: ReturnType<typeof useScheduleViewModel>
    let eventObserver: ((records: Event[]) => void) | undefined
    let observedColumns: Partial<Record<TableName, string[]>>
    let renderer: ReturnType<typeof create> | undefined

    const Harness = () => {
        viewModel = useScheduleViewModel()
        return null
    }

    beforeEach(() => {
        jest.clearAllMocks()
        eventObserver = undefined
        observedColumns = {}
        mockedGet.mockImplementation((tableName: TableName) => ({
            query: () => ({
                observeWithColumns: (columns: string[]) => {
                    observedColumns[tableName] = columns
                    return {
                        subscribe: (observer: Observer) => {
                            if (tableName === 'events')
                                eventObserver = records =>
                                    observer.next(records)
                            return { unsubscribe: jest.fn() }
                        },
                    }
                },
            }),
        }))
    })

    afterEach(() => {
        if (renderer) act(() => renderer?.unmount())
        renderer = undefined
    })

    it('updates schedule entries when an observed event changes', async () => {
        await act(async () => {
            renderer = create(React.createElement(Harness))
        })

        expect(observedColumns.events).toEqual([
            'title',
            'date_time',
            'end_time',
            'location',
            'description',
        ])

        const selectedDate = viewModel.selectedDate
        const event = (title: string, startHour: number): Event => {
            const dateTime = new Date(selectedDate)
            dateTime.setHours(startHour, 0, 0, 0)
            const endTime = new Date(dateTime)
            endTime.setHours(startHour + 1)
            return { id: 'event-1', title, dateTime, endTime } as Event
        }

        act(() => eventObserver?.([event('Planning', 9)]))
        expect(viewModel.entries[0]).toMatchObject({
            title: 'Planning',
            startHour: 9,
        })

        act(() => eventObserver?.([event('Planning moved', 11)]))
        expect(viewModel.entries[0]).toMatchObject({
            title: 'Planning moved',
            startHour: 11,
        })
    })
})
