import { act, create } from 'react-test-renderer'
import type { ReactTestRenderer } from 'react-test-renderer'
import { StyleSheet, Text } from 'react-native'

import { database, type User } from '../../../src/database'
import { BottomSheetLayout } from '../../../src/components/BottomSheetLayout'
import { StartYourDayScreen } from '../../../src/screens/StartYourDay/StartYourDayScreen'

jest.mock('../../../src/database', () => ({
    database: { get: jest.fn(), write: jest.fn() },
}))
jest.mock('lottie-react-native')
jest.mock('../../../src/components/StarBackground/StarBackground', () => ({
    StarBackground: () => null,
}))
jest.mock('../../../src/components/BottomSheetLayout', () => {
    const { Text: MockText, View: MockView } = require('react-native')

    return {
        BottomSheetLayout: ({
            children,
            isVisible,
            title,
        }: {
            children: React.ReactNode
            isVisible: boolean
            title: string
        }) =>
            isVisible ? (
                <MockView>
                    <MockText>{title}</MockText>
                    {children}
                </MockView>
            ) : null,
    }
})

describe('StartYourDayScreen', () => {
    let renderer: ReactTestRenderer
    type MockHabit = {
        id: string
        userId: string
        name: string
        status: string
        isFocusOfDay: boolean
        update: (writer: (record: MockHabit) => void) => Promise<void>
    }
    type MockObserver = { next: (rows: unknown[]) => void; error: () => void }
    let records: {
        habits: MockHabit[]
        habit_conditions: Array<Record<string, string>>
        habit_dependencies: Array<Record<string, string>>
    }
    let observers: Record<string, MockObserver[]>
    let unsubscribe: jest.Mock
    let shouldFailWrite: boolean

    beforeEach(() => {
        observers = {}
        shouldFailWrite = false
        records = {
            habits: [
                {
                    id: 'water',
                    userId: 'user-1',
                    name: 'Tomar água',
                    status: 'pending',
                    isFocusOfDay: false,
                    update: async () => undefined,
                },
                {
                    id: 'read',
                    userId: 'user-1',
                    name: 'Ler um livro',
                    status: 'pending',
                    isFocusOfDay: false,
                    update: async () => undefined,
                },
                {
                    id: 'walk',
                    userId: 'user-1',
                    name: 'Caminhar',
                    status: 'pending',
                    isFocusOfDay: false,
                    update: async () => undefined,
                },
                {
                    id: 'bath',
                    userId: 'user-1',
                    name: 'Tomar banho',
                    status: 'pending',
                    isFocusOfDay: false,
                    update: async () => undefined,
                },
            ],
            habit_conditions: [
                {
                    habitId: 'water',
                    conditionHabitId: 'walk',
                    conditionType: 'habit_status',
                },
            ],
            habit_dependencies: [
                {
                    habitId: 'bath',
                    triggerHabitId: 'walk',
                    type: 'after_completion',
                },
            ],
        }
        unsubscribe = jest.fn()
        records.habits.forEach(habit => {
            habit.update = async writer => {
                writer(habit)
                observers.habits?.forEach(observer =>
                    observer.next(records.habits),
                )
            }
        })
        ;(database.get as jest.Mock).mockImplementation((table: string) => ({
            query: () => ({
                observeWithColumns: () => ({
                    subscribe: (observer: MockObserver) => {
                        const tableObservers = (observers[table] ??= [])
                        tableObservers.push(observer)
                        observer.next(records[table as keyof typeof records])
                        return {
                            unsubscribe: () => {
                                unsubscribe()
                                const index = tableObservers.indexOf(observer)
                                if (index >= 0) tableObservers.splice(index, 1)
                            },
                        }
                    },
                }),
            }),
            find: async (id: string) => {
                const habit = records.habits.find(record => record.id === id)
                if (!habit) throw new Error('Habit not found')
                return habit
            },
        }))
        ;(database.write as jest.Mock).mockImplementation(
            async (work: () => Promise<void>) => {
                if (shouldFailWrite) throw new Error('Write failed')
                await work()
            },
        )
    })

    afterEach(() => {
        act(() => renderer?.unmount())
    })

    it('uses the idle 2 moon animation and persists selected focus habits', async () => {
        const onMenuPress = jest.fn()
        const currentUser = {
            id: 'user-1',
            name: 'John',
            mascotName: 'Lua',
            createdAt: new Date(),
        } as User

        act(() => {
            renderer = create(
                <StartYourDayScreen
                    currentUser={currentUser}
                    onMenuPress={onMenuPress}
                />,
            )
        })

        const moon = renderer.root.findByProps({
            testID: 'start-your-day-moon',
        })
        expect(moon.props.source).toBe(
            require('../../../src/assets/animations/moon_idle_2.json'),
        )
        expect(moon.props.autoPlay).toBe(true)
        expect(moon.props.loop).toBe(true)
        expect(
            renderer.root
                .findAllByType(Text)
                .some(text => text.props.children === 'Lua'),
        ).toBe(true)

        act(() => {
            renderer.root
                .findByProps({ accessibilityLabel: 'Open menu' })
                .props.onPress()
        })

        expect(onMenuPress).toHaveBeenCalledTimes(1)

        act(() => {
            renderer.root
                .findByProps({ testID: 'open-habit-picker' })
                .props.onPress()
        })

        const parent = renderer.root.findByProps({ testID: 'focus-habit-walk' })
        const child = renderer.root.findByProps({ testID: 'focus-habit-water' })
        expect(child.props.accessibilityHint).toBe('Depends on Caminhar')
        expect(
            StyleSheet.flatten(child.props.style).paddingLeft,
        ).toBeGreaterThan(StyleSheet.flatten(parent.props.style).paddingLeft)

        for (const habitId of ['walk', 'water', 'bath', 'read']) {
            await act(async () => {
                renderer.root
                    .findByProps({ testID: `focus-habit-${habitId}` })
                    .props.onPress()
            })
        }

        expect(
            records.habits
                .filter(habit => habit.isFocusOfDay)
                .map(habit => habit.id),
        ).toEqual(['water', 'read', 'walk', 'bath'])

        expect(
            renderer.root.findByProps({ testID: 'selected-habits-read' }).props
                .children,
        ).toBe('Ler um livro')
        expect(
            renderer.root.findByProps({ testID: 'selected-habits-walk' }).props
                .children,
        ).toBe('Caminhar - Tomar água - Tomar banho')
        expect(
            renderer.root.findByProps({ testID: 'focus-habit-walk' }).props
                .accessibilityState.checked,
        ).toBe(true)

        act(() => renderer.root.findByType(BottomSheetLayout).props.onClose())
        expect(
            renderer.root.findByType(BottomSheetLayout).props.isVisible,
        ).toBe(false)
        expect(
            renderer.root.findByProps({ testID: 'selected-habits-walk' }).props
                .children,
        ).toBe('Caminhar - Tomar água - Tomar banho')
        act(() =>
            renderer.root
                .findByProps({ testID: 'open-habit-picker' })
                .props.onPress(),
        )
        await act(async () =>
            renderer.root
                .findByProps({ testID: 'focus-habit-water' })
                .props.onPress(),
        )
        expect(
            records.habits.find(habit => habit.id === 'water')?.isFocusOfDay,
        ).toBe(false)
        expect(
            renderer.root.findByProps({ testID: 'selected-habits-walk' }).props
                .children,
        ).toBe('Caminhar - Tomar banho')

        // A removed relation makes the selected child an independent flag line.
        act(() => observers.habit_dependencies[0].next([]))
        expect(
            renderer.root.findByProps({ testID: 'selected-habits-walk' }).props
                .children,
        ).toBe('Caminhar')
        expect(
            renderer.root.findByProps({ testID: 'selected-habits-bath' }).props
                .children,
        ).toBe('Tomar banho')
    })

    it('keeps the focus unselected and reports an error when saving fails', async () => {
        const currentUser = { id: 'user-1', name: 'John' } as User
        act(() => {
            renderer = create(
                <StartYourDayScreen
                    currentUser={currentUser}
                    onMenuPress={jest.fn()}
                />,
            )
        })
        act(() =>
            renderer.root
                .findByProps({ testID: 'open-habit-picker' })
                .props.onPress(),
        )
        shouldFailWrite = true
        await act(async () => {
            await renderer.root
                .findByProps({ testID: 'focus-habit-walk' })
                .props.onPress()
        })

        expect(
            records.habits.find(habit => habit.id === 'walk')?.isFocusOfDay,
        ).toBe(false)
        expect(
            renderer.root.findByProps({ testID: 'focus-habit-walk' }).props
                .accessibilityState.checked,
        ).toBe(false)
        expect(
            renderer.root
                .findAllByType(Text)
                .some(
                    text =>
                        text.props.children ===
                        'Unable to update today’s focus. Please try again.',
                ),
        ).toBe(true)
    })

    it('reports empty and failed loads and can retry the local query', () => {
        records.habits = []
        act(() => {
            renderer = create(
                <StartYourDayScreen
                    currentUser={{ id: 'user-1' } as User}
                    onMenuPress={jest.fn()}
                />,
            )
        })
        act(() =>
            renderer.root
                .findByProps({ testID: 'open-habit-picker' })
                .props.onPress(),
        )
        const hasText = (value: string) =>
            renderer.root
                .findAllByType(Text)
                .some(text => text.props.children === value)
        expect(
            hasText('Create a habit in Habits to choose your focus for today.'),
        ).toBe(true)
        act(() => observers.habits[0].error())
        expect(hasText('Unable to load habits. Please try again.')).toBe(true)
        const retry = renderer.root.findAll(
            node =>
                node.props.onPress &&
                node
                    .findAllByType(Text)
                    .some(text => text.props.children === 'Try again'),
        )[0]
        act(() => retry.props.onPress())
        expect(hasText('Unable to load habits. Please try again.')).toBe(false)
        expect(unsubscribe).toHaveBeenCalledTimes(3)
    })
})
