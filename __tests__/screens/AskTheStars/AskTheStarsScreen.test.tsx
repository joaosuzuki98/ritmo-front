import { act, create } from 'react-test-renderer'
import type { ReactTestRenderer } from 'react-test-renderer'
import { ActivityIndicator, Text } from 'react-native'
import LottieView from 'lottie-react-native'
import { useIsFocused } from '@react-navigation/native'

import { database, type Habit, type User } from '../../../src/database'
import { AskTheStarsScreen } from '../../../src/screens/AskTheStars/AskTheStarsScreen'
import { AnimatedStarMessage } from '../../../src/screens/AskTheStars/components/AnimatedStarMessage'

jest.mock('../../../src/database', () => ({
    database: { get: jest.fn(), write: jest.fn() },
}))
jest.mock('lottie-react-native', () => ({
    __esModule: true,
    default: jest.fn(() => null),
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

    const screen = (habitId?: string) => (
        <AskTheStarsScreen
            currentUser={currentUser}
            initialHabitId={habitId}
            onClose={jest.fn()}
            onMenuPress={jest.fn()}
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
        observers = {}
        subscriptions = []
        ;(database.get as jest.Mock).mockImplementation((table: TableName) => ({
            query: () => ({
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
            expect(renderer.root.findAllByType(ActivityIndicator)).toHaveLength(
                1,
            )

            emit('habits', [makeHabit('Read')])
            emit(lastTable === 'events' ? 'completion_records' : 'events', [])
            expect(messages()).toEqual([])

            emit(lastTable, [])
            expect(renderer.root.findAllByType(ActivityIndicator)).toHaveLength(
                1,
            )
            act(() => jest.advanceTimersByTime(700))
            expect(renderer.root.findAllByType(ActivityIndicator)).toHaveLength(
                0,
            )
            expect(messages()).toEqual([
                'I need a little more history with Read before I can find a reliable pattern. Keep tracking it and ask me again soon.',
            ])
            expect(LottieView).toHaveBeenCalledTimes(1)
        },
    )

    it('shows the menu message immediately without waiting for analysis data', () => {
        act(() => {
            renderer = create(screen())
        })
        expect([...new Set(messages())]).toEqual([
            'Coming soon! Ask the stars for guidance with your habits.',
        ])
        expect(renderer.root.findAllByType(ActivityIndicator)).toHaveLength(0)
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
        expect(renderer.root.findAllByType(ActivityIndicator)).toHaveLength(1)
        act(() => jest.advanceTimersByTime(700))
        expect(messages()).toHaveLength(1)
        expect(messages()[0]).toContain('with Walk')
        expect(LottieView).toHaveBeenCalledTimes(1)
    })

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
        expect(renderer.root.findAllByType(ActivityIndicator)).toHaveLength(1)
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
        expect(renderer.root.findAllByType(ActivityIndicator)).toHaveLength(1)

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
        expect(renderer.root.findAllByType(ActivityIndicator)).toHaveLength(1)
        act(() => jest.advanceTimersByTime(700))
        expect(renderer.root.findAllByType(ActivityIndicator)).toHaveLength(0)
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

            expect(renderer.root.findAllByType(ActivityIndicator)).toHaveLength(
                0,
            )
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
