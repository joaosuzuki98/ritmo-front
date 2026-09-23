import { useRef, useState } from 'react'
import { PanGestureHandler } from 'react-native-gesture-handler'
import type { PanGestureHandlerGestureEvent } from 'react-native-gesture-handler'
import {
    Pressable,
    ScrollView,
    Text,
    View,
    useWindowDimensions,
} from 'react-native'
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated'

import { TopBar } from '../../components/TopBar'
import { colors } from '../../styles/colors'
import { globalStyles } from '../../styles/globalStyles'
import { spacing } from '../../styles/spacing'
import { getResponsiveScale } from '../../styles/responsive'
import { typography } from '../../styles/typography'
import { DaySelector } from './components/DaySelector'
import { AddHabitModal } from './components/AddHabitModal'
import { HabitCard } from './components/HabitCard'
import { HabitToolbar } from './components/HabitToolbar'
import { HabitDetailsModal } from './components/HabitDetailsModal'
import { SearchInput } from './components/SearchInput'
import type {
    HabitsDashboardScreenProps,
    HabitCardViewData,
} from './habitDashboard.types'
import { useHabitsDashboardViewModel } from './useHabitsDashboardViewModel'

export const HabitsDashboardScreen = ({
    currentUserId,
    initialWeekDay,
    isAddHabitModalVisible = false,
    onOpenAddHabitModal = () => undefined,
    onCloseAddHabitModal = () => undefined,
}: HabitsDashboardScreenProps) => {
    const viewModel = useHabitsDashboardViewModel(currentUserId, initialWeekDay)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [selectedHabit, setSelectedHabit] =
        useState<HabitCardViewData | null>(null)
    const { width } = useWindowDimensions()
    const scale = getResponsiveScale(width)
    const draggedIndex = useSharedValue(-1)
    const dragTranslationY = useSharedValue(0)
    const dayTranslationX = useSharedValue(0)
    const lastTranslationX = useRef(0)
    const daySwipeStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: dayTranslationX.value }],
    }))

    const handleSwipe = (event: PanGestureHandlerGestureEvent) => {
        lastTranslationX.current = event.nativeEvent.translationX
        dayTranslationX.value = event.nativeEvent.translationX
    }

    const finishDaySwipe = (delta: number, enterFrom: number) => {
        viewModel.moveDay(delta)
        dayTranslationX.value = enterFrom
        requestAnimationFrame(() => {
            dayTranslationX.value = withTiming(0, { duration: 220 })
        })
    }

    const handleSwipeEnd = () => {
        const translationX = lastTranslationX.current
        lastTranslationX.current = 0
        if (Math.abs(translationX) < 50) {
            dayTranslationX.value = withSpring(0)
            return
        }

        const direction = translationX < 0 ? -1 : 1
        const delta = direction < 0 ? 1 : -1
        const exitTo = direction * width
        dayTranslationX.value = withTiming(
            exitTo,
            { duration: 180 },
            finished => {
                if (finished) runOnJS(finishDaySwipe)(delta, -exitTo)
            },
        )
    }

    return (
        <View style={globalStyles.screen}>
            <TopBar
                userName={viewModel.user?.name ?? 'Teste da Silva'}
                level={viewModel.user?.level ?? 7}
                totalPoints={viewModel.user?.totalPoints ?? 27}
                onProfilePress={() => undefined}
                onMenuPress={() => undefined}
            />
            <ScrollView
                contentContainerStyle={{ paddingBottom: spacing.xl * scale }}
                keyboardShouldPersistTaps="handled"
                style={{ backgroundColor: colors.background }}
            >
                <View
                    style={{
                        alignItems: 'center',
                        backgroundColor: colors.surface,
                        paddingTop: 32 * scale,
                    }}
                >
                    <Text
                        style={{
                            color: colors.text,
                            fontFamily: typography.fontFamily,
                            fontSize: 56 * scale,
                            fontWeight: '500',
                        }}
                    >
                        Habits
                    </Text>
                    <DaySelector
                        weekDay={viewModel.weekDay}
                        onChange={next =>
                            viewModel.moveDay(next - viewModel.weekDay)
                        }
                    />
                </View>
                <HabitToolbar
                    isSearchOpen={isSearchOpen}
                    sort={viewModel.sort}
                    onSearch={() => setIsSearchOpen(true)}
                    onSort={viewModel.setSort}
                />
                {isSearchOpen ? (
                    <SearchInput
                        value={viewModel.query}
                        onChangeText={viewModel.setQuery}
                        onClose={() => setIsSearchOpen(false)}
                        onClear={viewModel.clearSearch}
                    />
                ) : null}
                <PanGestureHandler
                    activeOffsetX={[-50, 50]}
                    onEnded={handleSwipeEnd}
                    onGestureEvent={handleSwipe}
                >
                    <Animated.View
                        style={[
                            { paddingHorizontal: spacing.lg * scale },
                            daySwipeStyle,
                        ]}
                    >
                        {viewModel.state === 'loading' ? (
                            <Text
                                accessibilityLabel="Loading habits"
                                style={{
                                    color: colors.textMuted,
                                    fontFamily: typography.fontFamily,
                                    paddingVertical: 24,
                                }}
                            >
                                Loading habits…
                            </Text>
                        ) : null}
                        {viewModel.state === 'error' ? (
                            <View>
                                <Text
                                    style={{
                                        color: colors.text,
                                        fontFamily: typography.fontFamily,
                                        paddingVertical: 16,
                                    }}
                                >
                                    Unable to load habits.
                                </Text>
                                <Pressable
                                    accessibilityLabel="Retry loading habits"
                                    onPress={() => viewModel.moveDay(0)}
                                >
                                    <Text
                                        style={{
                                            color: colors.accent,
                                            fontFamily: typography.fontFamily,
                                        }}
                                    >
                                        Retry
                                    </Text>
                                </Pressable>
                            </View>
                        ) : null}
                        {viewModel.state === 'empty' ? (
                            <View>
                                <Text
                                    style={{
                                        color: colors.textMuted,
                                        fontFamily: typography.fontFamily,
                                        paddingVertical: 24,
                                    }}
                                >
                                    No habits for this day.
                                </Text>
                                <Pressable
                                    accessibilityLabel="Add a habit"
                                    onPress={onOpenAddHabitModal}
                                >
                                    <Text
                                        style={{
                                            color: colors.accent,
                                            fontFamily: typography.fontFamily,
                                        }}
                                    >
                                        Add habit
                                    </Text>
                                </Pressable>
                            </View>
                        ) : null}
                        {viewModel.state === 'no-results' ? (
                            <View>
                                <Text
                                    style={{
                                        color: colors.textMuted,
                                        fontFamily: typography.fontFamily,
                                        paddingVertical: 24,
                                    }}
                                >
                                    No habits match your search.
                                </Text>
                                <Pressable
                                    accessibilityLabel="Clear search"
                                    onPress={viewModel.clearSearch}
                                >
                                    <Text
                                        style={{
                                            color: colors.accent,
                                            fontFamily: typography.fontFamily,
                                        }}
                                    >
                                        Clear search
                                    </Text>
                                </Pressable>
                            </View>
                        ) : null}
                        {viewModel.state === 'success' &&
                            viewModel.visibleCards.map((habit, index) => (
                                <HabitCard
                                    key={`${viewModel.weekDay}-${habit.id}`}
                                    habit={habit}
                                    onPress={() => setSelectedHabit(habit)}
                                    onPause={() =>
                                        viewModel.toggleHabitPause(habit.id)
                                    }
                                    index={index}
                                    totalCards={viewModel.visibleCards.length}
                                    draggedIndex={draggedIndex}
                                    dragTranslationY={dragTranslationY}
                                    isDragging={false}
                                    reducedMotion={viewModel.isReducedMotion}
                                    onDragEnd={target =>
                                        viewModel.reorder(index, target)
                                    }
                                    onMoveUp={() =>
                                        viewModel.reorder(index, index - 1)
                                    }
                                    onMoveDown={() =>
                                        viewModel.reorder(index, index + 1)
                                    }
                                />
                            ))}
                    </Animated.View>
                </PanGestureHandler>
            </ScrollView>
            <AddHabitModal
                initialWeekDay={viewModel.weekDay}
                isVisible={isAddHabitModalVisible}
                onClose={onCloseAddHabitModal}
                onCreateHabit={viewModel.createHabit}
            />
            <HabitDetailsModal
                habit={selectedHabit}
                isVisible={selectedHabit !== null}
                onClose={() => setSelectedHabit(null)}
            />
        </View>
    )
}
