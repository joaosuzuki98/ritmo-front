import { act, create } from 'react-test-renderer'
import { useNetInfo } from '@react-native-community/netinfo'
import type { NetInfoState } from '@react-native-community/netinfo'

import { database } from '../../../src/database'
import { synchronizeDatabase } from '../../../src/database/sync/synchronize'
import { useLanguageStore } from '../../../src/localization/useLanguageStore'
import { useAiChatViewModel } from '../../../src/screens/AskTheStars/useAiChatViewModel'
import { aiEndpoints } from '../../../src/services/endpoints/ai'
import type { AiAgentResponse } from '../../../src/services/endpoints/ai'
import { AiChatError } from '../../../src/services/aiChatError'

jest.mock('@react-native-community/netinfo', () => ({ useNetInfo: jest.fn() }))
jest.mock('../../../src/database', () => ({ database: { get: jest.fn() } }))
jest.mock('../../../src/database/sync/synchronize', () => ({
    synchronizeDatabase: jest.fn(),
}))
jest.mock('../../../src/services/endpoints/ai', () => ({
    aiEndpoints: { streamChat: jest.fn(), decideProposal: jest.fn() },
}))

const proposalId = '33114aa6-ab20-41d1-9f08-45f439ef7c53'
const proposal: AiAgentResponse = {
    reply: 'Posso criar a tarefa.',
    proposal: { type: 'todo.create', task: { title: 'Comprar ração' } },
    proposalId,
    proposalExpiresAt: '2026-11-25T12:15:00.000Z',
}
const emptyResponse: AiAgentResponse = {
    reply: 'Olá!',
    proposal: null,
    proposalId: null,
    proposalExpiresAt: null,
}
const mockChat = jest.mocked(aiEndpoints.streamChat)
const mockDecide = jest.mocked(aiEndpoints.decideProposal)
const mockSync = jest.mocked(synchronizeDatabase)

describe('useAiChatViewModel', () => {
    let renderer: ReturnType<typeof create> | undefined
    let viewModel: ReturnType<typeof useAiChatViewModel>

    const Harness = () => {
        viewModel = useAiChatViewModel('user-1')
        return null
    }
    const renderHook = () => {
        act(() => {
            renderer = create(<Harness />)
        })
    }
    const send = async (message = 'Crie uma tarefa') => {
        act(() => viewModel.setInput(message))
        await act(async () => viewModel.handleSend())
    }

    beforeEach(() => {
        useLanguageStore.setState({ language: 'en' })
        jest.clearAllMocks()
        jest.spyOn(console, 'warn').mockImplementation(() => undefined)
        jest.mocked(useNetInfo).mockReturnValue({
            isConnected: true,
            isInternetReachable: true,
        } as NetInfoState)
        mockChat.mockResolvedValue(emptyResponse)
        mockDecide.mockResolvedValue(undefined)
        mockSync.mockResolvedValue(undefined)
    })
    afterEach(() => {
        act(() => renderer?.unmount())
        renderer = undefined
        jest.restoreAllMocks()
    })

    it('sends only messages and history without reading local data', async () => {
        renderHook()
        await send('Primeira')
        await send('Segunda')
        expect(mockChat.mock.calls[1][0]).toEqual({
            message: 'Segunda',
            language: 'en',
            history: [
                { role: 'user', content: 'Primeira' },
                { role: 'assistant', content: 'Olá!' },
            ],
        })
        expect(database.get).not.toHaveBeenCalled()
    })

    it('uses the currently selected language without clearing the conversation', async () => {
        renderHook()
        await send('First')
        act(() => useLanguageStore.setState({ language: 'pt' }))
        await send('Segunda')
        expect(mockChat.mock.calls[0][0].language).toBe('en')
        expect(mockChat.mock.calls[1][0]).toMatchObject({
            language: 'pt',
            message: 'Segunda',
            history: [
                { role: 'user', content: 'First' },
                { role: 'assistant', content: 'Olá!' },
            ],
        })
    })

    it('does not send when offline', async () => {
        jest.mocked(useNetInfo).mockReturnValue({
            isConnected: false,
            isInternetReachable: false,
        } as NetInfoState)
        renderHook()
        await send()
        expect(mockChat).not.toHaveBeenCalled()
        expect(viewModel.messages).toEqual([])
    })

    it('confirms on the server before synchronizing local data', async () => {
        mockChat.mockResolvedValue(proposal)
        renderHook()
        await send()
        const message = viewModel.messages[1]
        expect(message.proposalState).toBe('pending')
        expect(mockDecide).not.toHaveBeenCalled()
        await act(async () => viewModel.confirmProposal(message.id))
        expect(mockDecide).toHaveBeenCalledWith(proposalId, 'accepted')
        expect(mockSync).toHaveBeenCalledTimes(1)
        expect(mockDecide.mock.invocationCallOrder[0]).toBeLessThan(
            mockSync.mock.invocationCallOrder[0],
        )
        expect(viewModel.messages[1].proposalState).toBe('applied')
        expect(database.get).not.toHaveBeenCalled()
    })

    it('rejects on the server without applying or synchronizing', async () => {
        mockChat.mockResolvedValue(proposal)
        renderHook()
        await send()
        await act(async () =>
            viewModel.cancelProposal(viewModel.messages[1].id),
        )
        expect(mockDecide).toHaveBeenCalledWith(proposalId, 'rejected')
        expect(viewModel.messages[1].proposalState).toBe('cancelled')
        expect(mockSync).not.toHaveBeenCalled()
    })

    it('allows retrying a failed sync without accepting the proposal twice', async () => {
        mockChat.mockResolvedValue(proposal)
        mockSync.mockRejectedValueOnce(new Error('offline'))
        renderHook()
        await send()
        const id = viewModel.messages[1].id
        await act(async () => viewModel.confirmProposal(id))
        expect(viewModel.messages[1].proposalState).toBe('syncPending')
        expect(viewModel.errorMessage).toContain('saved on the server')
        await act(async () => viewModel.confirmProposal(id))
        expect(mockDecide).toHaveBeenCalledTimes(1)
        expect(mockSync).toHaveBeenCalledTimes(2)
        expect(viewModel.messages[1].proposalState).toBe('applied')
    })

    it('keeps the proposal pending if the server rejects the decision', async () => {
        mockChat.mockResolvedValue(proposal)
        mockDecide.mockRejectedValue(
            new AiChatError({ stage: 'proposal', status: 409 }),
        )
        renderHook()
        await send()
        await act(async () =>
            viewModel.confirmProposal(viewModel.messages[1].id),
        )
        expect(viewModel.messages[1].proposalState).toBe('pending')
        expect(mockSync).not.toHaveBeenCalled()
        expect(viewModel.errorMessage).toContain('expired')
    })

    it('clears a completed conversation', async () => {
        renderHook()
        await send()
        act(() => viewModel.clearChat())
        expect(viewModel.messages).toEqual([])
        expect(viewModel.input).toBe('')
    })

    it('aborts an active SSE request on unmount', async () => {
        let finish: (value: AiAgentResponse) => void = () => undefined
        mockChat.mockImplementation(
            () =>
                new Promise(resolve => {
                    finish = resolve
                }),
        )
        renderHook()
        act(() => viewModel.setInput('Olá'))
        let pending: Promise<void>
        await act(async () => {
            pending = viewModel.handleSend()
            await Promise.resolve()
        })
        const signal = mockChat.mock.calls[0][1]
        act(() => renderer?.unmount())
        renderer = undefined
        expect(signal?.aborted).toBe(true)
        await act(async () => {
            finish(emptyResponse)
            await pending
        })
    })
})
