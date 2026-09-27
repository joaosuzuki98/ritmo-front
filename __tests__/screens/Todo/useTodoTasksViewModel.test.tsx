import React from 'react'
import { act, create } from 'react-test-renderer'

import { database } from '../../../src/database'
import { useTodoTasksViewModel } from '../../../src/screens/Todo/useTodoTasksViewModel'

jest.mock('../../../src/database', () => ({
    database: {
        get: jest.fn(),
        write: jest.fn(),
    },
}))

type TaskRecord = {
    id: string
    userId: string
    title: string
    category: string
    isComplete: boolean
    createdAt: Date
    updatedAt: Date
    update: (mutate: (record: TaskRecord) => void) => Promise<TaskRecord>
}

type TasksViewModel = ReturnType<typeof useTodoTasksViewModel>

const mockedGet = database.get as jest.Mock
const mockedWrite = database.write as jest.Mock

describe('useTodoTasksViewModel', () => {
    let observerNext: ((tasks: TaskRecord[]) => void) | null
    let createdRecord: TaskRecord | null
    let viewModel: TasksViewModel
    let renderer: ReturnType<typeof create> | undefined
    let collection: {
        query: jest.Mock
        create: jest.Mock
        find: jest.Mock
    }

    const Harness = () => {
        viewModel = useTodoTasksViewModel('local-user')
        return null
    }

    const createTaskRecord = (): TaskRecord => {
        const record: TaskRecord = {
            id: 'task-1',
            userId: 'local-user',
            title: 'Write report',
            category: 'Work',
            isComplete: false,
            createdAt: new Date(2026, 8, 26),
            updatedAt: new Date(2026, 8, 26),
            update: async mutate => {
                mutate(record)
                return record
            },
        }
        return record
    }

    beforeEach(() => {
        jest.clearAllMocks()
        observerNext = null
        createdRecord = null
        collection = {
            query: jest.fn(),
            create: jest.fn(),
            find: jest.fn(),
        }
        const observe = jest.fn(() => ({
            subscribe: jest.fn((observer: unknown) => {
                observerNext = (
                    observer as { next: (tasks: TaskRecord[]) => void }
                ).next
                return { unsubscribe: jest.fn() }
            }),
        }))
        collection.query.mockReturnValue({
            observe,
            fetch: jest.fn().mockResolvedValue([]),
        })
        collection.create.mockImplementation(
            async (prepare: (record: TaskRecord) => void) => {
                const record = createTaskRecord()
                prepare(record)
                createdRecord = record
                return record
            },
        )
        collection.find.mockResolvedValue(createTaskRecord())
        mockedGet.mockReturnValue(collection)
        mockedWrite.mockImplementation(
            async (operation: () => Promise<unknown>) => operation(),
        )
    })

    afterEach(() => {
        if (renderer) act(() => renderer?.unmount())
        renderer = undefined
    })

    it('saves newly created tasks to WatermelonDB', async () => {
        await act(async () => {
            renderer = create(React.createElement(Harness))
        })

        await act(async () => {
            await viewModel.createTask('Write report', 'Work')
        })

        expect(mockedWrite).toHaveBeenCalledTimes(1)
        expect(collection.create).toHaveBeenCalledTimes(1)
        expect(createdRecord).toMatchObject({
            userId: 'local-user',
            title: 'Write report',
            category: 'Work',
            isComplete: false,
        })
    })

    it('persists task completion changes and observes stored tasks', async () => {
        const task = createTaskRecord()
        collection.find.mockResolvedValue(task)
        await act(async () => {
            renderer = create(React.createElement(Harness))
        })
        act(() => observerNext?.([task]))

        expect(viewModel.tasks).toEqual([task])
        await act(async () => {
            await viewModel.toggleTask(task.id)
        })

        expect(mockedWrite).toHaveBeenCalledTimes(1)
        expect(collection.find).toHaveBeenCalledWith(task.id)
        expect(task.isComplete).toBe(true)
    })
})
