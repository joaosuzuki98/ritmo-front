import React from 'react'
import { act, create } from 'react-test-renderer'

import { database } from '../../../src/database'
import { useTodoCategoriesViewModel } from '../../../src/screens/Todo/useTodoCategoriesViewModel'

jest.mock('../../../src/database', () => ({
    database: {
        get: jest.fn(),
        write: jest.fn(),
    },
}))

type CategoryRecord = {
    userId: string
    name: string
    createdAt?: Date
    updatedAt?: Date
}

type CategoriesViewModel = ReturnType<typeof useTodoCategoriesViewModel>

const mockedGet = database.get as jest.Mock
const mockedWrite = database.write as jest.Mock

describe('useTodoCategoriesViewModel', () => {
    let viewModel: CategoriesViewModel
    let createdRecord: CategoryRecord | null
    let renderer: ReturnType<typeof create> | undefined
    let collection: {
        query: jest.Mock
        create: jest.Mock
    }

    const Harness = () => {
        viewModel = useTodoCategoriesViewModel('local-user')
        return null
    }

    beforeEach(() => {
        jest.clearAllMocks()
        createdRecord = null
        collection = {
            query: jest.fn(() => ({
                observe: jest.fn(() => ({
                    subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
                })),
                fetch: jest.fn().mockResolvedValue([]),
            })),
            create: jest.fn(
                async (prepare: (record: CategoryRecord) => void) => {
                    const record: CategoryRecord = { userId: '', name: '' }
                    prepare(record)
                    createdRecord = record
                    return record
                },
            ),
        }
        mockedGet.mockReturnValue(collection)
        mockedWrite.mockImplementation(
            async (operation: () => Promise<unknown>) => operation(),
        )
    })

    afterEach(() => {
        if (renderer) act(() => renderer?.unmount())
        renderer = undefined
    })

    it('persists a new category for the current user', async () => {
        await act(async () => {
            renderer = create(React.createElement(Harness))
        })

        await act(async () => {
            await viewModel.createCategory('Personal')
        })

        expect(mockedWrite).toHaveBeenCalledTimes(1)
        expect(collection.create).toHaveBeenCalledTimes(1)
        expect(createdRecord).toMatchObject({
            userId: 'local-user',
            name: 'Personal',
        })
    })
})
