import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { AppState, type AppStateStatus } from 'react-native'

import { registerDailyAccess } from '../../src/database/registerDailyAccess'
import { useDailyAccess } from '../../src/navigation/useDailyAccess'

jest.mock('../../src/database/registerDailyAccess', () => ({
    registerDailyAccess: jest.fn(),
}))

describe('daily entry lifecycle', () => {
    let renderer: ReactTestRenderer
    let state: ReturnType<typeof useDailyAccess>
    let onAppStateChange: (value: AppStateStatus) => void
    const remove = jest.fn()
    const Probe = () => {
        state = useDailyAccess('user-1')
        return null
    }

    beforeEach(() => {
        jest.clearAllMocks()
        jest.spyOn(AppState, 'addEventListener').mockImplementation(
            (_event, listener) => {
                onAppStateChange = listener
                return { remove }
            },
        )
    })

    afterEach(() => {
        act(() => renderer?.unmount())
        jest.restoreAllMocks()
    })

    it('shows the first daily entry, keeps it while resuming, and dismisses it after Continue', async () => {
        jest.mocked(registerDailyAccess).mockResolvedValue({
            date: '2026-11-03',
            isFirstAccess: true,
            hasHabits: true,
            totalAccessDays: 1,
        })
        await act(async () => {
            renderer = create(<Probe />)
        })
        expect(state.access?.shouldShowStart).toBe(true)
        jest.mocked(registerDailyAccess).mockResolvedValue({
            date: '2026-11-03',
            isFirstAccess: false,
            hasHabits: true,
            totalAccessDays: 1,
        })
        await act(async () => onAppStateChange('active'))
        expect(state.access?.shouldShowStart).toBe(true)
        act(() => state.finishStart())
        await act(async () => onAppStateChange('active'))
        expect(state.access?.shouldShowStart).toBe(false)
        jest.mocked(registerDailyAccess).mockResolvedValue({
            date: '2026-11-05',
            isFirstAccess: true,
            hasHabits: true,
            totalAccessDays: 2,
        })
        await act(async () => onAppStateChange('active'))
        expect(state.access).toEqual({
            date: '2026-11-05',
            shouldShowStart: true,
            totalAccessDays: 2,
        })
    })

    it('skips the screen when restarting after the first visit, even without Continue', async () => {
        jest.mocked(registerDailyAccess).mockResolvedValueOnce({
            date: '2026-11-03',
            isFirstAccess: true,
            hasHabits: true,
            totalAccessDays: 1,
        })
        await act(async () => {
            renderer = create(<Probe />)
        })
        expect(state.access?.shouldShowStart).toBe(true)
        act(() => renderer.unmount())
        expect(remove).toHaveBeenCalled()
        jest.mocked(registerDailyAccess).mockResolvedValue({
            date: '2026-11-03',
            isFirstAccess: false,
            hasHabits: true,
            totalAccessDays: 1,
        })
        await act(async () => {
            renderer = create(<Probe />)
        })
        expect(state.access?.shouldShowStart).toBe(false)
    })

    it('skips a new account with no habits and only offers the screen on a later day with habits', async () => {
        jest.mocked(registerDailyAccess).mockResolvedValueOnce({
            date: '2026-11-03',
            isFirstAccess: true,
            hasHabits: false,
            totalAccessDays: 1,
        })
        await act(async () => {
            renderer = create(<Probe />)
        })
        expect(state.access).toEqual({
            date: '2026-11-03',
            shouldShowStart: false,
            totalAccessDays: 1,
        })

        jest.mocked(registerDailyAccess).mockResolvedValueOnce({
            date: '2026-11-03',
            isFirstAccess: false,
            hasHabits: true,
            totalAccessDays: 1,
        })
        await act(async () => onAppStateChange('active'))
        expect(state.access?.shouldShowStart).toBe(false)

        jest.mocked(registerDailyAccess).mockResolvedValueOnce({
            date: '2026-11-04',
            isFirstAccess: true,
            hasHabits: true,
            totalAccessDays: 2,
        })
        await act(async () => onAppStateChange('active'))
        expect(state.access?.shouldShowStart).toBe(true)
        expect(state.access?.totalAccessDays).toBe(2)
    })

    it('shares an in-flight check across foreground events', async () => {
        let resolve!: (
            value: Awaited<ReturnType<typeof registerDailyAccess>>,
        ) => void
        jest.mocked(registerDailyAccess).mockReturnValue(
            new Promise(done => {
                resolve = done
            }),
        )
        await act(async () => {
            renderer = create(<Probe />)
        })
        await act(async () => onAppStateChange('active'))
        expect(state.access).toBeNull()
        expect(registerDailyAccess).toHaveBeenCalledTimes(1)
        await act(async () =>
            resolve({
                date: '2026-11-03',
                isFirstAccess: true,
                hasHabits: true,
                totalAccessDays: 1,
            }),
        )
        expect(state.access?.shouldShowStart).toBe(true)
    })

    it('reports storage failure and retries the check', async () => {
        jest.mocked(registerDailyAccess).mockRejectedValueOnce(
            new Error('Disk error'),
        )
        await act(async () => {
            renderer = create(<Probe />)
        })
        expect(state.hasError).toBe(true)
        expect(state.access).toBeNull()
        jest.mocked(registerDailyAccess).mockResolvedValue({
            date: '2026-11-03',
            isFirstAccess: true,
            hasHabits: true,
            totalAccessDays: 1,
        })
        await act(async () => state.retry())
        expect(state.hasError).toBe(false)
        expect(state.access?.shouldShowStart).toBe(true)
    })
})
