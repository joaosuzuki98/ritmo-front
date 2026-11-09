import { act, create } from 'react-test-renderer'
import type { ReactTestRenderer } from 'react-test-renderer'
import { Text, TextInput } from 'react-native'
import LottieView from 'lottie-react-native'
import { useIsFocused } from '@react-navigation/native'
import { useNetInfo } from '@react-native-community/netinfo'
import type { NetInfoState } from '@react-native-community/netinfo'

import { database, type Habit, type User } from '../../../src/database'
import { AskTheStarsScreen } from '../../../src/screens/AskTheStars/AskTheStarsScreen'
import { AnimatedStarMessage } from '../../../src/screens/AskTheStars/components/AnimatedStarMessage'
import { AnimatedSuggestionCard } from '../../../src/screens/AskTheStars/components/AnimatedSuggestionCard'
import * as scheduleAnalysis from '../../../src/habits/habitScheduleAnalysis'
import * as loadAnalysis from '../../../src/habits/habitLoadAnalysis'
import { aiEndpoints } from '../../../src/services/endpoints/ai'

jest.mock('../../../src/database', () => ({
    database: { get: jest.fn(), write: jest.fn() },
}))
jest.mock('lottie-react-native', () => ({
    __esModule: true,
    default: jest.fn(() => null),
}))
jest.mock('@react-native-community/netinfo', () => ({
    useNetInfo: jest.fn(),
}))
jest.mock('../../../src/services/endpoints/ai', () => ({
    aiEndpoints: { chat: jest.fn() },
}))
jest.mock('../../../src/components/StarBackground/StarBackground', () => ({
    StarBackground: () => null,
}))
jest.mock('../../../src/components/TopBar/TopBar', () => ({
    TopBar: () => null,
}))
jest.mock('../../../src/components/BottomSheetLayout', () => ({
    BottomSheetLayout: () => null,
}))
jest.mock(
    '../../../src/screens/HabitsDashboard/components/AddHabitModal',
    () => ({ AddHabitModal: () => null }),
)
jest.mock('@react-navigation/native', () => ({
    useIsFocused: jest.fn(() => true),
}))
jest.mock(
    '../../../src/screens/AskTheStars/components/AnimatedStarMessage',
    () => {
        const { Text: MockText } = require('react-native')
        return {
            AnimatedStarMessage: jest.fn(({ message }: { message: string }) => (
                <MockText>{message}</MockText>
            )),
        }
    },
)

type TableName = 'habits' | 'events' | 'completion_records'
type Observer = {
    next: (records: unknown[]) => void
    error: () => void
}

const currentUser = {
    id: 'user-1',
    name: 'Alex',
    mascotName: 'Moon',
    totalPoints: 0,
} as User

const makeHabit = (id: string): Habit =>
    ({
        id,
        name: id,
        status: 'pending',
        weekDays: [1, 2, 3, 4, 5, 6, 7],
        preferredTime: new Date(2026, 10, 7, 19),
        createdAt: new Date(),
    } as Habit)

describe('AskTheStarsScreen analysis loading', () => {
    let renderer: ReactTestRenderer
    let observers: Partial<Record<TableName, Observer>>
    let subscriptions: jest.Mock[]

    const screen = (habitId?: string, isWeeklyLoadAnalysis = false) => (
        <AskTheStarsScreen
            currentUser={currentUser}
            initialHabitId={habitId}
            isWeeklyLoadAnalysis={isWeeklyLoadAnalysis}
            onClose={jest.fn()}
            onMenuPress={jest.fn()}
            onScheduleAccepted={jest.fn()}
            totalAccessDays={1}
        />
    )
    const emit = (table: TableName, records: unknown[]) => {
        act(() => observers[table]?.next(records))
    }
    const messages = () =>
        jest
            .mocked(AnimatedStarMessage)
            .mock.calls.map(([props]) => props.message)

    beforeEach(() => {
        jest.clearAllMocks()
        jest.useFakeTimers()
        jest.mocked(useIsFocused).mockReturnValue(true)
        jest.mocked(useNetInfo).mockReturnValue({
            isConnected: true,
            isInternetReachable: true,
        } as NetInfoState)
        jest.mocked(aiEndpoints.chat).mockResolvedValue({
            reply: 'Here is a suggestion.',
            proposal: null,
        })
        observers = {}
        subscriptions = []
        ;(database.get as jest.Mock).mockImplementation((table: TableName) => ({
            query: () => ({
                fetch: async () => [],
                observeWithColumns: () => ({
                    subscribe: (observer: Observer) => {
                        observers[table] = observer
                        const unsubscribe = jest.fn()
                        subscriptions.push(unsubscribe)
                        return { unsubscribe }
                    },
                }),
            }),
        }))
    })

    afterEach(() => {
        act(() => renderer?.unmount())
        subscriptions.forEach(unsubscribe =>
            expect(unsubscribe).toHaveBeenCalled(),
        )
        jest.useRealTimers()
        jest.restoreAllMocks()
    })

    it.each(['events', 'completion_records'] as const)(
        'waits for %s before animating the analysis and keeps the moon stable',
        lastTable => {
            act(() => {
                renderer = create(screen('Read'))
            })
            expect(messages()).toEqual([])
            expect(
                renderer.root
                    .findAllByType(Text)
                    .some(
                        node =>
                            node.props.children ===
                            'Reading your habit history…',
                    ),
            ).toBe(true)
            emit('habits', [makeHabit('Read')])
            emit(lastTable === 'events' ? 'completion_records' : 'events', [])
            expect(messages()).toEqual([])

            emit(lastTable, [])
            act(() => jest.advanceTimersByTime(700))
            expect(messages()).toEqual([
                'I need a little more history with Read before I can find a reliable pattern. Keep tracking it and ask me again soon.',
            ])
            expect(LottieView).toHaveBeenCalledTimes(1)
        },
    )

    it('shows the chat composer in the general Ask the Stars flow', () => {
        act(() => {
            renderer = create(screen())
        })
        expect(renderer.root.findAllByType(TextInput)).toHaveLength(1)
        expect(
            renderer.root
                .findAllByType(Text)
                .some(
                    node =>
                        node.props.children ===
                        'Tell me what you would like to change or add to your habit routine.',
                ),
        ).toBe(true)
        expect(messages()).toEqual([])
        emit('habits', [])
        emit('events', [])
        emit('completion_records', [])

        expect(messages()).toEqual([])
    })

    it('disables the composer and explains the offline requirement', () => {
        jest.mocked(useNetInfo).mockReturnValue({
            isConnected: false,
            isInternetReachable: false,
        } as NetInfoState)
        act(() => {
            renderer = create(screen())
        })

        expect(renderer.root.findByType(TextInput).props.editable).toBe(false)
        expect(
            renderer.root
                .findAllByType(Text)
                .some(
                    node =>
                        node.props.children ===
                        'An internet connection is required for a new AI response.',
                ),
        ).toBe(true)
    })

    it('renders sent and returned messages and displays request errors', async () => {
        act(() => {
            renderer = create(screen())
        })
        const input = renderer.root.findByType(TextInput)
        act(() => input.props.onChangeText('Help me make a routine'))
        const sendButton = renderer.root.findByProps({
            accessibilityLabel: 'Send message',
        })
        await act(async () => sendButton.props.onPress())

        const visibleTexts = () =>
            renderer.root.findAllByType(Text).map(node => node.props.children)
        expect(visibleTexts()).toContain('Help me make a routine')
        expect(visibleTexts()).toContain('Here is a suggestion.')
        expect(aiEndpoints.chat).toHaveBeenCalledTimes(1)

        jest.mocked(aiEndpoints.chat).mockRejectedValueOnce(
            new Error('Network error'),
        )
        act(() =>
            renderer.root
                .findByType(TextInput)
                .props.onChangeText('Another question'),
        )
        await act(async () =>
            renderer.root
                .findByProps({ accessibilityLabel: 'Send message' })
                .props.onPress(),
        )

        expect(visibleTexts()).toContain(
            'Unable to get an AI response. Please try again.',
        )
    })

    it('shows weekly load guidance only in the weekly analysis flow', () => {
        act(() => {
            renderer = create(screen(undefined, true))
        })
        expect(renderer.root.findAllByType(TextInput)).toHaveLength(0)
        expect(messages()).toEqual([])
        emit('habits', [])
        emit('events', [])
        emit('completion_records', [])

        expect(messages()).toHaveLength(1)
        expect(messages()[0]).toContain('at least 5 active habits')
        expect(renderer.root.findAllByType(TextInput)).toHaveLength(0)
    })

    it('uses the requested habit immediately when returning from another modal', () => {
        act(() => {
            renderer = create(screen('Read'))
        })
        emit('habits', [makeHabit('Read'), makeHabit('Walk')])
        emit('events', [])
        emit('completion_records', [])
        act(() => jest.advanceTimersByTime(700))
        jest.mocked(AnimatedStarMessage).mockClear()

        act(() => renderer.update(screen('Walk')))

        expect(messages()).toEqual([])
        act(() => jest.advanceTimersByTime(700))
        expect(messages()).toHaveLength(1)
        expect(messages()[0]).toContain('with Walk')
        expect(LottieView).toHaveBeenCalledTimes(1)
    })

    it.each(['schedule', 'reduce', 'increase'] as const)(
        'reveals %s cards only after the message finishes and resets on revisiting',
        flow => {
            jest.spyOn(
                scheduleAnalysis,
                'analyzeHabitSchedules',
            ).mockReturnValue([
                {
                    habitId: 'Read',
                    occurrenceCount: 20,
                    successRate: 0,
                    hasEnoughHistory: true,
                    isLowSuccess: true,
                    suggestions: [
                        {
                            days: [1],
                            time: new Date(2026, 10, 7, 9),
                            successRate: 1,
                            sampleCount: 10,
                        },
                    ],
                },
            ])
            jest.spyOn(loadAnalysis, 'analyzeWeeklyHabitLoad').mockReturnValue(
                flow === 'increase'
                    ? {
                          kind: 'increase',
                          weeklyRates: [],
                          completionRate: 1,
                          lighterDays: [
                              {
                                  weekDay: 2,
                                  scheduledHabitCount: 0,
                                  estimatedMinutes: 0,
                                  eventCount: 0,
                              },
                          ],
                      }
                    : {
                          kind: 'reduce',
                          weeklyRates: [],
                          completionRate: 0,
                          leastCompletedHabits: [
                              {
                                  id: 'Read',
                                  name: 'Read',
                                  rate: 0,
                                  occurrenceCount: 20,
                              },
                          ],
                      },
            )
            const renderScreen = () =>
                screen(
                    flow === 'schedule' ? 'Read' : undefined,
                    flow !== 'schedule',
                )
            const finishMessage = () =>
                act(() => {
                    renderer.root
                        .findByType(AnimatedStarMessage)
                        .props.onAnimationComplete()
                })
            act(() => {
                renderer = create(renderScreen())
            })
            emit('habits', [makeHabit('Read')])
            emit('events', [])
            emit('completion_records', [])
            act(() => jest.advanceTimersByTime(700))
            expect(
                renderer.root.findAllByType(AnimatedSuggestionCard),
            ).toHaveLength(0)

            finishMessage()
            expect(
                renderer.root.findAllByType(AnimatedSuggestionCard),
            ).toHaveLength(1)

            jest.mocked(useIsFocused).mockReturnValue(false)
            act(() => renderer.update(renderScreen()))
            jest.mocked(useIsFocused).mockReturnValue(true)
            act(() => renderer.update(renderScreen()))
            act(() => jest.advanceTimersByTime(700))
            expect(
                renderer.root.findAllByType(AnimatedSuggestionCard),
            ).toHaveLength(0)
            finishMessage()
            expect(
                renderer.root.findAllByType(AnimatedSuggestionCard),
            ).toHaveLength(1)
        },
    )

    it('shows the real loading text on every visit with already loaded data', () => {
        act(() => {
            renderer = create(screen('Read'))
        })
        emit('habits', [makeHabit('Read')])
        emit('events', [])
        emit('completion_records', [])
        act(() => jest.advanceTimersByTime(700))
        const subscriptionCount = subscriptions.length

        jest.mocked(useIsFocused).mockReturnValue(false)
        act(() => renderer.update(screen('Read')))
        act(() => jest.advanceTimersByTime(5000))
        jest.mocked(AnimatedStarMessage).mockClear()
        jest.mocked(useIsFocused).mockReturnValue(true)
        act(() => renderer.update(screen('Read')))

        expect(
            renderer.root
                .findAllByType(Text)
                .some(
                    node =>
                        node.props.children === 'Reading your habit history…',
                ),
        ).toBe(true)
        expect(messages()).toEqual([])
        act(() => jest.advanceTimersByTime(699))
        expect(messages()).toEqual([])
        act(() => jest.advanceTimersByTime(1))
        expect(messages()).toHaveLength(1)
        expect(subscriptions).toHaveLength(subscriptionCount)
        expect(LottieView).toHaveBeenCalledTimes(1)
    })

    it('shows loading when analysis is opened after visiting through the menu', () => {
        act(() => {
            renderer = create(screen())
        })
        emit('habits', [makeHabit('Read')])
        emit('events', [])
        emit('completion_records', [])
        act(() => jest.advanceTimersByTime(5000))
        jest.mocked(AnimatedStarMessage).mockClear()

        act(() => renderer.update(screen('Read')))
        expect(messages()).toEqual([])
        act(() => jest.advanceTimersByTime(700))
        expect(messages()).toHaveLength(1)
    })

    it('waits for new history when the habit list changes', () => {
        const read = makeHabit('Read')
        act(() => {
            renderer = create(screen('Read'))
        })
        emit('habits', [read])
        emit('events', [])
        emit('completion_records', [])
        act(() => jest.advanceTimersByTime(700))
        const previousHistoryObserver = observers.completion_records
        jest.mocked(AnimatedStarMessage).mockClear()

        emit('habits', [read, makeHabit('Walk')])
        act(() => previousHistoryObserver?.next([]))
        expect(messages()).toEqual([])
        emit('completion_records', [])
        expect(messages()).toHaveLength(1)
        expect(LottieView).toHaveBeenCalledTimes(1)
    })

    it('finishes loading when there are no habits', () => {
        act(() => {
            renderer = create(screen('missing'))
        })
        emit('habits', [])
        emit('events', [])
        act(() => jest.advanceTimersByTime(700))
        expect(messages()).toHaveLength(1)
        expect(observers.completion_records).toBeUndefined()
    })

    it.each([
        ['habits', 'Unable to load your habits.'],
        ['events', 'Unable to load your schedule.'],
        ['completion_records', 'Unable to load your completion history.'],
    ] as const)(
        'stops loading and shows an error if %s fails',
        (table, message) => {
            act(() => {
                renderer = create(screen('Read'))
            })
            emit('habits', [makeHabit('Read')])
            act(() => observers[table]?.error())
            emit('events', [])

            expect(messages()).toEqual([])
            expect(
                renderer.root
                    .findAllByType(Text)
                    .some(node => node.props.children === message),
            ).toBe(true)
            expect(LottieView).toHaveBeenCalledTimes(1)
        },
    )
})
