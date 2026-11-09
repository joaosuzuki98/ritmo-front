import { act, create } from 'react-test-renderer'

import { database, type Habit } from '../../../src/database'
import { aiEndpoints } from '../../../src/services/endpoints/ai'
import { useNetInfo } from '@react-native-community/netinfo'
import type { NetInfoState } from '@react-native-community/netinfo'
import {
    createHabitLocally,
    updateHabitLocally,
} from '../../../src/screens/HabitsDashboard/habitPersistence'
import { useAiChatViewModel } from '../../../src/screens/AskTheStars/useAiChatViewModel'
import type { AiChatRequest } from '../../../src/services/endpoints/ai'
import { AiChatError } from '../../../src/services/aiChatError'
import { applyAiProposalLocally } from '../../../src/screens/AskTheStars/aiProposalPersistence'

const mockCreateHabitLocally = jest.mocked(createHabitLocally)
const mockUpdateHabitLocally = jest.mocked(updateHabitLocally)

jest.mock('@react-native-community/netinfo', () => ({
    __esModule: true,
    useNetInfo: jest.fn(),
}))
jest.mock('../../../src/database', () => ({
    database: { get: jest.fn(), write: jest.fn() },
}))
jest.mock('../../../src/services/endpoints/ai', () => ({
    aiEndpoints: { chat: jest.fn() },
}))
jest.mock('../../../src/screens/HabitsDashboard/habitPersistence', () => ({
    createHabitLocally: jest.fn(),
    getConditionStatus: jest.fn(() => undefined),
    updateHabitLocally: jest.fn(),
}))
jest.mock('../../../src/screens/AskTheStars/aiProposalPersistence', () => ({
    applyAiProposalLocally: jest.fn(),
}))

const mockedGet = database.get as jest.Mock
const mockUseNetInfo = jest.mocked(useNetInfo)
const mockChat = jest.mocked(aiEndpoints.chat)
const mockApplyProposal = jest.mocked(applyAiProposalLocally)

const habit = (id: string, status = 'pending') =>
    ({
        id,
        userId: 'user-1',
        name: `Habit ${id}`,
        frequencyType: 'daily',
        weekDays: [1, 2, 3, 4, 5, 6, 7],
        preferredTime: new Date(2026, 0, 1, 9),
        priority: 'medium',
        status,
        isFocusOfDay: false,
    } as Habit)

describe('useAiChatViewModel', () => {
    let renderer: ReturnType<typeof create> | undefined
    let viewModel: ReturnType<typeof useAiChatViewModel>
    let habits: Habit[]

    const Harness = () => {
        viewModel = useAiChatViewModel('user-1')
        return null
    }

    const send = async (message = 'Help me add a habit') => {
        act(() => viewModel.setInput(message))
        await act(async () => viewModel.handleSend())
    }

    beforeEach(() => {
        jest.clearAllMocks()
        jest.spyOn(console, 'warn').mockImplementation(() => undefined)
        habits = [habit('habit-1')]
        mockUseNetInfo.mockReturnValue({
            isConnected: true,
            isInternetReachable: true,
        } as NetInfoState)
        mockChat.mockResolvedValue({ reply: 'Sure.', proposal: null })
        mockCreateHabitLocally.mockResolvedValue(habit('local-id'))
        mockUpdateHabitLocally.mockResolvedValue(habit('habit-1'))
        mockApplyProposal.mockResolvedValue(undefined)
        mockedGet.mockImplementation((table: string) => ({
            query: () => ({
                fetch: async () =>
                    table === 'habits'
                        ? habits
                        : table === 'categories'
                        ? []
                        : [],
            }),
            find: async (id: string) =>
                habits.find(item => item.id === id) ?? null,
        }))
    })

    afterEach(() => {
        act(() => renderer?.unmount())
        renderer = undefined
        jest.restoreAllMocks()
    })

    const renderHook = () => {
        act(() => {
            renderer = create(<Harness />)
        })
    }

    it('shows user and assistant messages and sends only capped habit context', async () => {
        habits = Array.from({ length: 34 }, (_, index) =>
            habit(`habit-${index}`, index === 0 ? 'paused' : 'pending'),
        )
        renderHook()

        await send('What habit should I add?')

        expect(viewModel.messages.map(message => message.role)).toEqual([
            'user',
            'assistant',
        ])
        expect(viewModel.messages[1].content).toBe('Sure.')
        expect(mockChat).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'What habit should I add?',
                context: {
                    habits: expect.arrayContaining([
                        expect.objectContaining({ preferredTime: '09:00' }),
                    ]),
                },
            }),
        )
        const request = mockChat.mock.calls[0][0] as AiChatRequest
        expect(request.context?.habits).toHaveLength(30)
        expect(request.context?.habits[0].id).toBe('habit-1')
        expect(request.context?.habits[0]).not.toHaveProperty(
            'completionRecords',
        )
    })

    it('does not send while offline', async () => {
        mockUseNetInfo.mockReturnValue({
            isConnected: false,
            isInternetReachable: false,
        } as NetInfoState)
        renderHook()

        await send()

        expect(viewModel.isOnline).toBe(false)
        expect(viewModel.messages).toHaveLength(0)
        expect(mockChat).not.toHaveBeenCalled()
    })

    it('keeps the message visible and exposes an error after a failed response', async () => {
        mockChat.mockRejectedValue(new Error('Network error'))
        renderHook()

        await send()

        expect(viewModel.messages).toHaveLength(1)
        expect(viewModel.messages[0].content).toBe('Help me add a habit')
        expect(viewModel.errorMessage).toBe(
            'Unable to get an AI response. Please try again.',
        )
    })

    it('keeps valid create proposals reviewable and writes only after confirmation', async () => {
        mockChat.mockResolvedValue({
            reply: 'I can add walking every day.',
            proposal: {
                type: 'habit.create',
                habit: {
                    name: 'Walking',
                    frequencyType: 'daily',
                    priority: 'medium',
                    categoryName: 'Saúde',
                },
            },
        })
        renderHook()
        await send()

        const assistantMessage = viewModel.messages[1]
        expect(assistantMessage.proposalState).toBe('pending')
        act(() => viewModel.openCreateProposal(assistantMessage.id))
        expect(viewModel.createInitialFormData?.categoryName).toBe('Saúde')
        expect(mockCreateHabitLocally).not.toHaveBeenCalled()
        await act(async () =>
            viewModel.createHabitFromProposal(viewModel.createInitialFormData!),
        )

        expect(mockCreateHabitLocally).toHaveBeenCalledWith(
            'user-1',
            expect.objectContaining({
                priority: 'medium',
                weekDays: [1, 2, 3, 4, 5, 6, 7],
                categoryName: 'Saúde',
            }),
            undefined,
        )
        expect(viewModel.messages[1].proposalState).toBe('applied')
        expect(mockChat).toHaveBeenCalledTimes(1)
    })

    it('shows a response-contract error and logs only its diagnostic fields', async () => {
        mockChat.mockRejectedValue(
            new AiChatError({
                stage: 'response',
                fields: ['proposal.habit.preferredTime'],
            }),
        )
        renderHook()
        await send()

        expect(viewModel.errorMessage).toBe(
            'The AI response does not match the expected format.',
        )
        expect(console.warn).toHaveBeenCalledWith('AI chat failed', {
            stage: 'response',
            fields: ['proposal.habit.preferredTime'],
        })
        expect(mockCreateHabitLocally).not.toHaveBeenCalled()
    })

    it('cancels a valid proposal without changing local data', async () => {
        mockChat.mockResolvedValue({
            reply: 'I can add walking every day.',
            proposal: {
                type: 'habit.create',
                habit: { name: 'Walking', frequencyType: 'daily' },
            },
        })
        renderHook()
        await send()

        act(() => viewModel.cancelProposal(viewModel.messages[1].id))

        expect(viewModel.messages[1].proposalState).toBe('cancelled')
        expect(mockCreateHabitLocally).not.toHaveBeenCalled()
        expect(mockChat).toHaveBeenCalledTimes(1)
    })

    it('marks mismatched update targets invalid and never applies them', async () => {
        mockChat.mockResolvedValue({
            reply: 'I can change this habit.',
            proposal: {
                type: 'habit.update',
                entityId: 'not-in-context',
                changes: { name: 'New name' },
            },
        })
        renderHook()
        await send()

        expect(viewModel.messages[1].proposalState).toBe('invalid')
        await act(async () =>
            viewModel.confirmUpdateProposal(viewModel.messages[1].id),
        )
        expect(mockUpdateHabitLocally).not.toHaveBeenCalled()
    })

    it('applies a valid update through the shared local dashboard use case', async () => {
        mockChat.mockResolvedValue({
            reply: 'I can change the name.',
            proposal: {
                type: 'habit.update',
                entityId: 'habit-1',
                changes: { name: 'New habit name' },
            },
        })
        renderHook()
        await send()

        await act(async () =>
            viewModel.confirmUpdateProposal(viewModel.messages[1].id),
        )

        expect(mockUpdateHabitLocally).toHaveBeenCalledWith(
            'user-1',
            'habit-1',
            expect.objectContaining({ name: 'New habit name' }),
            undefined,
        )
        expect(viewModel.messages[1].proposalState).toBe('applied')
        expect(mockChat).toHaveBeenCalledTimes(1)
    })

    it('requires confirmation for new action proposals and cancellation performs no writes', async () => {
        mockChat.mockResolvedValue({
            reply: 'I can add this task.',
            proposal: { type: 'todo.create', task: { title: 'Buy food' } },
        })
        renderHook()
        await send()

        const proposalMessage = viewModel.messages[1]
        expect(proposalMessage.proposalState).toBe('pending')
        expect(mockApplyProposal).not.toHaveBeenCalled()
        act(() => viewModel.cancelProposal(proposalMessage.id))
        expect(viewModel.messages[1].proposalState).toBe('cancelled')
        expect(mockApplyProposal).not.toHaveBeenCalled()
    })

    it('applies a confirmed action through local persistence only', async () => {
        mockChat.mockResolvedValue({
            reply: 'I can add this task.',
            proposal: { type: 'todo.create', task: { title: 'Buy food' } },
        })
        renderHook()
        await send()
        await act(async () =>
            viewModel.confirmUpdateProposal(viewModel.messages[1].id),
        )

        expect(mockApplyProposal).toHaveBeenCalledWith('user-1', {
            type: 'todo.create',
            task: { title: 'Buy food' },
        })
        expect(viewModel.messages[1].proposalState).toBe('applied')
        expect(mockChat).toHaveBeenCalledTimes(1)
    })

    it('requests statistics mode with aggregates and without raw completion rows', async () => {
        renderHook()
        await send('What is my completion rate this week?')

        const request = mockChat.mock.calls[0][0] as AiChatRequest
        expect(request.mode).toBe('statistics')
        expect(request.context?.statistics).toMatchObject({
            periods: expect.any(Array),
            habits: expect.any(Array),
            weeklyLoad: expect.any(Object),
        })
        expect(request.context).not.toHaveProperty('completionRecords')
        expect(request.context?.habits).not.toHaveProperty('completionHistory')
    })

    it('rejects proposals returned in statistics mode', async () => {
        mockChat.mockResolvedValue({
            reply: 'I can add a task.',
            proposal: { type: 'todo.create', task: { title: 'Buy food' } },
        })
        renderHook()
        await send('Show me my statistics')

        expect(viewModel.messages).toHaveLength(1)
        expect(viewModel.errorMessage).toBe(
            'The AI response does not match the expected format.',
        )
        expect(mockApplyProposal).not.toHaveBeenCalled()
    })
})
