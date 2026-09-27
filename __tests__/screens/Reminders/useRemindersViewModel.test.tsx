import React from 'react'
import { act, create } from 'react-test-renderer'

import { database } from '../../../src/database'
import { useRemindersViewModel } from '../../../src/screens/Reminders/useRemindersViewModel'

jest.mock('../../../src/database', () => ({
    database: {
        get: jest.fn(),
        write: jest.fn(),
    },
}))

type EventRecord = {
    id: string
    userId: string
    title: string
    dateTime: Date
    endTime?: Date
    location?: string
    description?: string
    recurrence: string
    countdownEnabled: boolean
    conversionOrigin: string
    updatedAt?: Date
    update: (mutate: (record: EventRecord) => void) => Promise<EventRecord>
    markAsDeleted: () => Promise<void>
}

type RemindersViewModel = ReturnType<typeof useRemindersViewModel>

const mockedGet = database.get as jest.Mock
const mockedWrite = database.write as jest.Mock

describe('useRemindersViewModel event persistence', () => {
    let viewModel: RemindersViewModel
    let records: EventRecord[]
    let createdRecord: EventRecord | null
    let renderer: ReturnType<typeof create> | undefined
    let eventsCollection: {
        query: jest.Mock
        create: jest.Mock
        find: jest.Mock
    }

    const Harness = () => {
        viewModel = useRemindersViewModel()
        return null
    }

    const createEventRecord = (): EventRecord => {
        const record: EventRecord = {
            id: 'event-1',
            userId: 'local-user',
            title: '',
            dateTime: new Date(),
            recurrence: 'none',
            countdownEnabled: false,
            conversionOrigin: 'reminders',
            update: async mutate => {
                mutate(record)
                return record
            },
            markAsDeleted: jest.fn(async () => undefined),
        }
        return record
    }

    beforeEach(() => {
        jest.clearAllMocks()
        records = []
        createdRecord = null
        eventsCollection = {
            query: jest.fn(() => ({
                observeWithColumns: jest.fn(() => ({
                    subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
                })),
                fetch: jest.fn().mockImplementation(async () => records),
            })),
            create: jest.fn().mockImplementation(async prepare => {
                const record = createEventRecord()
                prepare(record)
                records.push(record)
                createdRecord = record
                return record
            }),
            find: jest
                .fn()
                .mockImplementation(async (eventId: string) =>
                    records.find(record => record.id === eventId),
                ),
        }
        const habitsCollection = {
            query: jest.fn(() => ({ fetch: jest.fn().mockResolvedValue([]) })),
        }
        mockedGet.mockImplementation((tableName: string) =>
            tableName === 'events' ? eventsCollection : habitsCollection,
        )
        mockedWrite.mockImplementation(
            async (operation: () => Promise<unknown>) => operation(),
        )
    })

    afterEach(() => {
        if (renderer) act(() => renderer?.unmount())
        renderer = undefined
    })

    it('persists location and description when creating an event', async () => {
        await act(async () => {
            renderer = create(React.createElement(Harness))
        })

        await act(async () => {
            await viewModel.addEvent({
                title: 'Dentist',
                startHour: '09',
                startPeriod: 'AM',
                endHour: '10',
                endPeriod: 'AM',
                location: 'Downtown clinic',
                description: 'Bring insurance card',
            })
        })

        expect(createdRecord).toMatchObject({
            title: 'Dentist',
            location: 'Downtown clinic',
            description: 'Bring insurance card',
            conversionOrigin: 'reminders',
        })
    })

    it('updates and deletes a persisted reminder event', async () => {
        const event = createEventRecord()
        event.title = 'Dentist'
        event.dateTime = new Date()
        event.endTime = new Date(event.dateTime.getTime() + 60 * 60_000)
        records.push(event)

        await act(async () => {
            renderer = create(React.createElement(Harness))
        })
        await act(async () => {
            await viewModel.updateEvent('event-1', {
                title: 'Dentist appointment',
                startHour: '11',
                startPeriod: 'AM',
                endHour: '12',
                endPeriod: 'PM',
                location: 'New clinic',
                description: 'Use the side entrance',
            })
        })

        expect(event).toMatchObject({
            title: 'Dentist appointment',
            location: 'New clinic',
            description: 'Use the side entrance',
        })
        expect(event.dateTime.getHours()).toBe(11)
        expect(event.endTime?.getHours()).toBe(12)

        await act(async () => {
            await viewModel.deleteEvent('event-1')
        })
        expect(event.markAsDeleted).toHaveBeenCalledTimes(1)
        expect(mockedWrite).toHaveBeenCalledTimes(2)
    })
})
