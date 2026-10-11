import { useCallback, useEffect, useRef, useState } from 'react'
import { PanGestureHandler } from 'react-native-gesture-handler'
import type { PanGestureHandlerGestureEvent } from 'react-native-gesture-handler'
import {
    Alert,
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

import { ScreenLayout } from '../../components/ScreenLayout'
import { colors } from '../../styles/colors'
import { spacing } from '../../styles/spacing'
import { getResponsiveScale } from '../../styles/responsive'
import { theme } from '../../styles/theme'
import { typography } from '../../styles/typography'
import { DaySelector } from './components/DaySelector'
import { AddHabitModal } from './components/AddHabitModal'
import { HabitCard } from './components/HabitCard'
import { HabitToolbar } from './components/HabitToolbar'
import { HabitDetailsModal } from './components/HabitDetailsModal'
import { DoubleTapHintModal } from './components/DoubleTapHintModal'
import { LogHabitProgressModal } from './components/LogHabitProgressModal'
import { SearchInput } from './components/SearchInput'
import type {
    HabitsDashboardScreenProps,
    HabitCardViewData,
} from './habitDashboard.types'
import { useHabitsDashboardViewModel } from './useHabitsDashboardViewModel'
import { getHabitCardOffset } from './habitDragUtils'

export const HabitsDashboardScreen = ({
    currentUser,
    title = 'Habits',
    initialWeekDay,
    isAddHabitModalVisible = false,
    onMenuPress = () => undefined,
    onOpenAddHabitModal = () => undefined,
    onCloseAddHabitModal = () => undefined,
    isDoubleTapHintVisible = true,
    onCloseDoubleTapHint = () => undefined,
}: HabitsDashboardScreenProps) => {
    const viewModel = useHabitsDashboardViewModel(
        currentUser.id,
        initialWeekDay,
    )
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [selectedHabit, setSelectedHabit] =
        useState<HabitCardViewData | null>(null)
    const [habitBeingEdited, setHabitBeingEdited] =
        useState<HabitCardViewData | null>(null)
    const [habitToLog, setHabitToLog] = useState<HabitCardViewData | null>(null)
    const [celebrationTokens, setCelebrationTokens] = useState<
        Record<string, number>
    >({})
    const [pendingDayEnterFrom, setPendingDayEnterFrom] = useState<
        number | null
    >(null)
    const [isCommittingReorder, setIsCommittingReorder] = useState(false)
    const { width } = useWindowDimensions()
    const scale = getResponsiveScale(width)
    const draggedIndex = useSharedValue(-1)
    const draggedHabitId = useSharedValue<string | null>(null)
    const cardStepByHabitId = useSharedValue<Record<string, number>>({})
    const dragTranslationY = useSharedValue(0)
    const dragReleaseOffset = useSharedValue(0)
    const dayTranslationX = useSharedValue(0)
    const lastTranslationX = useRef(0)
    const daySwipeStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: dayTranslationX.value }],
    }))
    useEffect(() => {
        if (pendingDayEnterFrom === null || !viewModel.isDayReady) return

        const frame = requestAnimationFrame(() => {
            dayTranslationX.value = viewModel.isReducedMotion
                ? 0
                : withTiming(0, { duration: 220 })
            setPendingDayEnterFrom(null)
        })
        return () => cancelAnimationFrame(frame)
    }, [
        dayTranslationX,
        pendingDayEnterFrom,
        viewModel.isDayReady,
        viewModel.isReducedMotion,
    ])

    const handleSwipe = (event: PanGestureHandlerGestureEvent) => {
        lastTranslationX.current = event.nativeEvent.translationX
        dayTranslationX.value = event.nativeEvent.translationX
    }

    const finishDaySwipe = (delta: number, enterFrom: number) => {
        viewModel.moveDay(delta)
        dayTranslationX.value = enterFrom
        setPendingDayEnterFrom(enterFrom)
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

    const handleDeleteHabit = (habit: HabitCardViewData) => {
        Alert.alert(
            'Delete habit?',
            `“${habit.title}” will be removed from your habits.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        viewModel
                            .deleteHabit(habit.id)
                            .then(() => setSelectedHabit(null))
                            .catch(() =>
                                Alert.alert(
                                    'Unable to delete habit',
                                    'Please try again.',
                                ),
                            )
                    },
                },
            ],
        )
    }

    const handleCompleteHabit = async (habitId: string) => {
        const shouldCelebrate =
            viewModel.visibleCards.find(habit => habit.id === habitId)
                ?.status !== 'completed'
        const completed = await viewModel.completeHabit(habitId)
        if (completed && shouldCelebrate)
            setCelebrationTokens(current => ({
                ...current,
                [habitId]: (current[habitId] ?? 0) + 1,
            }))
        if (completed === false)
            Alert.alert(
                'Cannot complete habit',
                'You can only complete a habit for today.',
            )
    }

    const handleSaveHabitProgress = async (
        habitId: string,
        formData: Parameters<typeof viewModel.recordHabitProgress>[1],
    ) => {
        const shouldCelebrate =
            formData.status === 'completed' &&
            viewModel.visibleCards.find(habit => habit.id === habitId)
                ?.status !== 'completed'
        const saved = await viewModel.recordHabitProgress(habitId, formData)
        if (saved && shouldCelebrate)
            setCelebrationTokens(current => ({
                ...current,
                [habitId]: (current[habitId] ?? 0) + 1,
            }))
        if (saved === false)
            Alert.alert(
                'Cannot complete habit',
                'You can only complete a habit for today.',
            )
        return saved
    }

    const handleReorder = (sourceIndex: number, targetIndex: number) => {
        setIsCommittingReorder(true)
        viewModel.reorder(sourceIndex, targetIndex)
    }
    const handleReorderAnimationComplete = useCallback(
        () => setIsCommittingReorder(false),
        [],
    )
    const orderedHabitIds = viewModel.visibleCards.map(habit => habit.id)
    const defaultDragStep =
        (theme.spacing.habitCardMinHeight + theme.spacing.habitCardGap) * scale
    const habitListStyle = useAnimatedStyle(() => ({
        height: getHabitCardOffset(
            orderedHabitIds.length,
            orderedHabitIds,
            cardStepByHabitId.value,
            defaultDragStep,
        ),
    }))

    return (
        <ScreenLayout
            title={title}
            subtitle={
                <DaySelector
                    weekDay={viewModel.weekDay}
                    onChange={next => {
                        setPendingDayEnterFrom(null)
                        dayTranslationX.value = 0
                        viewModel.moveDay(next - viewModel.weekDay)
                    }}
                />
            }
            userName={currentUser.name}
            level={currentUser.level}
            totalPoints={currentUser.totalPoints}
            onProfilePress={() => undefined}
            onMenuPress={onMenuPress}
        >
            <ScrollView
                contentContainerStyle={{ paddingBottom: spacing.xl * scale }}
                keyboardShouldPersistTaps="handled"
                style={{ backgroundColor: colors.background }}
            >
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
                    enabled={!isCommittingReorder}
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
                                    paddingVertical: spacing.lg,
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
                                        paddingVertical: spacing.md,
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
                            <View
                                className={
                                    viewModel.hasAnyHabits
                                        ? 'min-h-[180px] items-center justify-center'
                                        : undefined
                                }
                            >
                                <Text
                                    style={{
                                        color: colors.textMuted,
                                        fontFamily: typography.fontFamily,
                                        paddingVertical: spacing.lg,
                                        ...(viewModel.hasAnyHabits
                                            ? { textAlign: 'center' as const }
                                            : {}),
                                    }}
                                >
                                    {viewModel.hasAnyHabits
                                        ? 'No habits for this day.'
                                        : 'No habits yet. Create your first habit to get started.'}
                                </Text>
                                {!viewModel.hasAnyHabits ? (
                                    <Pressable
                                        accessibilityLabel="Add a habit"
                                        onPress={onOpenAddHabitModal}
                                    >
                                        <Text
                                            style={{
                                                color: colors.accent,
                                                fontFamily:
                                                    typography.fontFamily,
                                            }}
                                        >
                                            Add habit
                                        </Text>
                                    </Pressable>
                                ) : null}
                            </View>
                        ) : null}
                        {viewModel.state === 'no-results' ? (
                            <View>
                                <Text
                                    style={{
                                        color: colors.textMuted,
                                        fontFamily: typography.fontFamily,
                                        paddingVertical: spacing.lg,
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
                        {viewModel.state === 'success' ? (
                            <Animated.View style={habitListStyle}>
                                {viewModel.visibleCards.map((habit, index) => (
                                    <HabitCard
                                        key={habit.id}
                                        habit={habit}
                                        dayKey={viewModel.selectedDate.toISOString()}
                                        celebrationToken={
                                            celebrationTokens[habit.id] ?? 0
                                        }
                                        onPress={() => setSelectedHabit(habit)}
                                        onPause={() =>
                                            viewModel.toggleHabitPause(habit.id)
                                        }
                                        onComplete={() =>
                                            handleCompleteHabit(habit.id)
                                        }
                                        index={index}
                                        orderedHabitIds={orderedHabitIds}
                                        draggedIndex={draggedIndex}
                                        draggedHabitId={draggedHabitId}
                                        cardStepByHabitId={cardStepByHabitId}
                                        dragTranslationY={dragTranslationY}
                                        dragReleaseOffset={dragReleaseOffset}
                                        isDragging={false}
                                        isCommittingReorder={
                                            isCommittingReorder
                                        }
                                        onReorderAnimationComplete={
                                            handleReorderAnimationComplete
                                        }
                                        reducedMotion={
                                            viewModel.isReducedMotion
                                        }
                                        onDragEnd={target =>
                                            handleReorder(index, target)
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
                        ) : null}
                    </Animated.View>
                </PanGestureHandler>
            </ScrollView>
            <AddHabitModal
                habitOptions={viewModel.habitOptions}
                categoryOptions={viewModel.categoryOptions}
                initialWeekDay={viewModel.weekDay}
                habit={habitBeingEdited}
                isVisible={isAddHabitModalVisible || habitBeingEdited !== null}
                onClose={() => {
                    setHabitBeingEdited(null)
                    onCloseAddHabitModal()
                }}
                onCreateHabit={viewModel.createHabit}
                onUpdateHabit={viewModel.updateHabit}
            />
            <HabitDetailsModal
                habit={selectedHabit}
                isVisible={selectedHabit !== null}
                onClose={() => setSelectedHabit(null)}
                onEdit={() => {
                    setHabitBeingEdited(selectedHabit)
                    setSelectedHabit(null)
                }}
                onDelete={() => {
                    if (selectedHabit) handleDeleteHabit(selectedHabit)
                }}
                onLogProgress={() => {
                    setHabitToLog(selectedHabit)
                    setSelectedHabit(null)
                }}
            />
            <LogHabitProgressModal
                habit={habitToLog}
                isVisible={habitToLog !== null}
                selectedDate={viewModel.selectedDate}
                onClose={() => setHabitToLog(null)}
                onSave={handleSaveHabitProgress}
            />
            <DoubleTapHintModal
                isVisible={isDoubleTapHintVisible}
                onClose={onCloseDoubleTapHint}
            />
        </ScreenLayout>
    )
}
