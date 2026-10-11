import { useCallback, useEffect, useRef, useState } from 'react'
import Animated, {
    Easing,
    FadeOut,
    ZoomIn,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated'
import { PanGestureHandler } from 'react-native-gesture-handler'
import type { PanGestureHandlerGestureEvent } from 'react-native-gesture-handler'
import {
    Pressable,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native'
import type { LayoutChangeEvent } from 'react-native'
import {
    CheckCircle,
    Flame,
    Pause,
    Play,
    Sun,
    Warning,
} from 'phosphor-react-native'
import type { SharedValue } from 'react-native-reanimated'

import type { HabitCardViewData } from '../habitDashboard.types'
import {
    getDragTargetIndex,
    getDragTranslationToIndex,
    getHabitCardOffset,
} from '../habitDragUtils'
import { colors } from '../../../styles/colors'
import { getResponsiveScale } from '../../../styles/responsive'
import { theme } from '../../../styles/theme'
import { typography } from '../../../styles/typography'

type HabitCardProps = {
    habit: HabitCardViewData
    dayKey: string
    celebrationToken: number
    onPress: () => void
    onPause: () => void
    onComplete: () => void
    onMoveUp: () => void
    onMoveDown: () => void
    onDragEnd: (targetIndex: number) => void
    onReorderAnimationComplete: () => void
    isDragging: boolean
    isCommittingReorder: boolean
    index: number
    reducedMotion: boolean
    orderedHabitIds: readonly string[]
    draggedIndex: SharedValue<number>
    draggedHabitId: SharedValue<string | null>
    cardStepByHabitId: SharedValue<Record<string, number>>
    dragTranslationY: SharedValue<number>
    dragReleaseOffset: SharedValue<number>
}

export const HabitCard = ({
    habit,
    dayKey,
    celebrationToken,
    onPress,
    onPause,
    onComplete,
    onDragEnd,
    onReorderAnimationComplete,
    isDragging,
    isCommittingReorder,
    index,
    reducedMotion,
    orderedHabitIds,
    draggedIndex,
    draggedHabitId,
    cardStepByHabitId,
    dragTranslationY,
    dragReleaseOffset,
}: HabitCardProps) => {
    const { width } = useWindowDimensions()
    const scale = getResponsiveScale(width)
    const habitId = habit.id
    const cardMarginBottom = theme.spacing.habitCardGap * scale
    const defaultDragStep =
        (theme.spacing.habitCardMinHeight + theme.spacing.habitCardGap) * scale
    const [isGestureDragging, setIsGestureDragging] = useState(false)
    const lastTranslationY = useRef(0)
    const tapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
    const lastTapAt = useRef(0)
    const [showCelebration, setShowCelebration] = useState(false)
    const [titleTextWidth, setTitleTextWidth] = useState(0)
    const previousCelebration = useRef({
        dayKey,
        token: celebrationToken,
    })
    const pauseOpacity = useSharedValue(habit.isPaused ? 0.48 : 1)
    useEffect(() => {
        const nextOpacity = habit.isPaused ? 0.48 : 1
        pauseOpacity.value = reducedMotion
            ? nextOpacity
            : withTiming(nextOpacity, { duration: 220 })
    }, [habit.isPaused, pauseOpacity, reducedMotion])
    const visualStyle = useAnimatedStyle(() => ({
        opacity:
            pauseOpacity.value *
            (isCommittingReorder
                ? withTiming(1, {
                      duration: 120,
                      easing: Easing.out(Easing.cubic),
                  })
                : isDragging || isGestureDragging
                ? 0.7
                : 1),
    }))
    const finishReorderAnimation = useCallback(() => {
        draggedIndex.value = -1
        draggedHabitId.value = null
        dragTranslationY.value = 0
        dragReleaseOffset.value = 0
        setIsGestureDragging(false)
        onReorderAnimationComplete()
    }, [
        dragReleaseOffset,
        dragTranslationY,
        draggedHabitId,
        draggedIndex,
        onReorderAnimationComplete,
    ])
    useEffect(() => {
        if (!isCommittingReorder || draggedHabitId.value !== habitId) return

        if (reducedMotion) {
            finishReorderAnimation()
            return
        }

        dragReleaseOffset.value = withTiming(
            0,
            { duration: 120, easing: Easing.out(Easing.cubic) },
            finished => {
                if (finished) runOnJS(finishReorderAnimation)()
            },
        )
    }, [
        draggedHabitId,
        dragReleaseOffset,
        finishReorderAnimation,
        habitId,
        isCommittingReorder,
        reducedMotion,
    ])
    useEffect(() => {
        const previous = previousCelebration.current
        previousCelebration.current = { dayKey, token: celebrationToken }

        if (previous.dayKey !== dayKey) {
            if (tapTimeout.current) clearTimeout(tapTimeout.current)
            tapTimeout.current = null
            lastTapAt.current = 0
            setIsGestureDragging(false)
            setShowCelebration(false)
            return
        }
        if (previous.token === celebrationToken) return

        setShowCelebration(true)
        const timeout = setTimeout(() => setShowCelebration(false), 760)
        return () => clearTimeout(timeout)
    }, [celebrationToken, dayKey])
    useEffect(
        () => () => {
            if (tapTimeout.current) clearTimeout(tapTimeout.current)
        },
        [],
    )
    const handleCardPress = () => {
        const now = Date.now()
        if (now - lastTapAt.current < 280) {
            if (tapTimeout.current) clearTimeout(tapTimeout.current)
            tapTimeout.current = null
            lastTapAt.current = 0
            if (habit.isBlocked) onPress()
            else onComplete()
            return
        }
        lastTapAt.current = now
        tapTimeout.current = setTimeout(() => {
            lastTapAt.current = 0
            tapTimeout.current = null
            onPress()
        }, 280)
    }
    const dragStyle = useAnimatedStyle(() => {
        const cardTop = getHabitCardOffset(
            index,
            orderedHabitIds,
            cardStepByHabitId.value,
            defaultDragStep,
        )
        if (isCommittingReorder) {
            const isDraggedCard = draggedHabitId.value === habitId
            return {
                transform: [
                    {
                        translateY: isDraggedCard
                            ? cardTop + dragReleaseOffset.value
                            : reducedMotion
                            ? cardTop
                            : withTiming(cardTop, {
                                  duration: 120,
                                  easing: Easing.out(Easing.cubic),
                              }),
                    },
                    {
                        scale:
                            isDraggedCard && !reducedMotion
                                ? withTiming(1, {
                                      duration: 120,
                                      easing: Easing.out(Easing.cubic),
                                  })
                                : 1,
                    },
                ],
                zIndex: isDraggedCard ? 2 : 0,
            }
        }

        const sourceIndex = draggedIndex.value
        if (sourceIndex < 0)
            return {
                transform: [
                    {
                        translateY: reducedMotion
                            ? cardTop
                            : withTiming(cardTop, {
                                  duration: 120,
                                  easing: Easing.out(Easing.cubic),
                              }),
                    },
                    { scale: 1 },
                ],
                zIndex: 0,
            }

        const targetIndex = getDragTargetIndex(
            sourceIndex,
            dragTranslationY.value,
            orderedHabitIds,
            cardStepByHabitId.value,
            defaultDragStep,
            cardMarginBottom,
        )
        if (index === sourceIndex)
            return {
                transform: [
                    { translateY: cardTop + dragTranslationY.value },
                    { scale: 1.02 },
                ],
                zIndex: 2,
            }

        const isMovingDown =
            targetIndex > sourceIndex &&
            index > sourceIndex &&
            index <= targetIndex
        const isMovingUp =
            targetIndex < sourceIndex &&
            index >= targetIndex &&
            index < sourceIndex
        const sourceStep =
            cardStepByHabitId.value[orderedHabitIds[sourceIndex]] ??
            defaultDragStep
        const offset = isMovingDown ? -sourceStep : isMovingUp ? sourceStep : 0
        return {
            transform: [
                {
                    translateY: reducedMotion
                        ? cardTop + offset
                        : withTiming(cardTop + offset, {
                              duration: 100,
                              easing: Easing.out(Easing.cubic),
                          }),
                },
                { scale: 1 },
            ],
            zIndex: 0,
        }
    })
    const handleGestureEvent = (event: PanGestureHandlerGestureEvent) => {
        lastTranslationY.current = event.nativeEvent.translationY
        draggedIndex.value = index
        draggedHabitId.value = habitId
        dragTranslationY.value = lastTranslationY.current
        if (Math.abs(lastTranslationY.current) > 8) setIsGestureDragging(true)
    }
    const handleCardLayout = (event: LayoutChangeEvent) => {
        const nextStep = event.nativeEvent.layout.height + cardMarginBottom
        if (
            Math.abs(
                (cardStepByHabitId.value[habitId] ?? defaultDragStep) -
                    nextStep,
            ) < 0.5
        )
            return

        cardStepByHabitId.value = {
            ...cardStepByHabitId.value,
            [habitId]: nextStep,
        }
    }
    const clearDrag = () => {
        draggedIndex.value = -1
        draggedHabitId.value = null
        dragTranslationY.value = 0
        dragReleaseOffset.value = 0
        setIsGestureDragging(false)
    }
    const handleGestureEnd = (translationY: number) => {
        draggedIndex.value = index
        draggedHabitId.value = habitId
        const targetIndex = getDragTargetIndex(
            index,
            translationY,
            orderedHabitIds,
            cardStepByHabitId.value,
            defaultDragStep,
            cardMarginBottom,
        )
        lastTranslationY.current = 0

        if (targetIndex === index) {
            clearDrag()
            return
        }
        dragTranslationY.value = translationY
        const targetTranslationY = getDragTranslationToIndex(
            index,
            targetIndex,
            orderedHabitIds,
            cardStepByHabitId.value,
            defaultDragStep,
        )
        dragReleaseOffset.value = translationY - targetTranslationY
        onDragEnd(targetIndex)

        if (reducedMotion) {
            clearDrag()
            onReorderAnimationComplete()
            return
        }
    }
    // Keep the native origin fixed so a React reorder cannot add a second
    // displacement to the drag transform before the UI thread updates it.
    const content = (
        <Animated.View
            className="absolute inset-x-0 top-0"
            onLayout={handleCardLayout}
            style={[
                {
                    backgroundColor: habit.isFocusOfDay
                        ? colors.warning
                        : habit.priorityColor,
                    borderRadius: 16 * scale,
                    minHeight: theme.spacing.habitCardMinHeight * scale,
                    paddingHorizontal: 24 * scale,
                    paddingVertical: 18 * scale,
                },
                visualStyle,
                dragStyle,
            ]}
        >
            {showCelebration ? (
                <View pointerEvents="none" style={styles.celebrationLayer}>
                    {[
                        { color: colors.success, left: '10%', top: '28%' },
                        { color: colors.accent, left: '28%', top: '10%' },
                        { color: colors.text, left: '52%', top: '18%' },
                        { color: colors.success, left: '72%', top: '34%' },
                        { color: colors.accent, left: '84%', top: '12%' },
                        { color: colors.text, left: '42%', top: '42%' },
                    ].map((particle, particleIndex) => (
                        <Animated.View
                            entering={ZoomIn.delay(particleIndex * 30).duration(
                                180,
                            )}
                            exiting={FadeOut.duration(380)}
                            key={`${particle.left}-${particle.top}`}
                            style={[
                                styles.celebrationParticle,
                                {
                                    backgroundColor: particle.color,
                                    left: particle.left,
                                    top: particle.top,
                                },
                            ]}
                        />
                    ))}
                </View>
            ) : null}
            <Pressable
                accessibilityLabel={`Open details for ${habit.title}`}
                accessibilityHint={
                    habit.isBlocked
                        ? `Requirement not met: ${habit.blockingHabitTitles.join(
                              ', ',
                          )}.`
                        : undefined
                }
                accessibilityRole="button"
                onPress={handleCardPress}
                className="flex-1"
            >
                <View className="flex-row items-center justify-between">
                    <View className="relative flex-1">
                        <Text
                            numberOfLines={1}
                            onTextLayout={event => {
                                const nextWidth =
                                    event.nativeEvent.lines[0]?.width ?? 0
                                setTitleTextWidth(currentWidth =>
                                    currentWidth === nextWidth
                                        ? currentWidth
                                        : nextWidth,
                                )
                            }}
                            style={[
                                {
                                    color: colors.priorityText,
                                    fontFamily: typography.fontFamily,
                                    fontSize: 20 * scale,
                                },
                                habit.isFocusOfDay
                                    ? styles.focusText
                                    : styles.semiboldText,
                            ]}
                        >
                            {habit.title}
                            {habit.categoryLabel
                                ? ` - ${habit.categoryLabel}`
                                : ''}
                        </Text>
                        {habit.status === 'completed' && titleTextWidth > 0 ? (
                            <View
                                pointerEvents="none"
                                className="absolute left-0 h-[2px]"
                                style={{
                                    backgroundColor: colors.priorityText,
                                    top: 12 * scale,
                                    width: titleTextWidth,
                                }}
                            />
                        ) : null}
                    </View>
                    <View style={styles.headerActions}>
                        {habit.status === 'completed' ? (
                            <CheckCircle
                                color={colors.success}
                                size={27 * scale}
                                weight="fill"
                            />
                        ) : (
                            <>
                                {habit.status === 'partial' ? (
                                    <Warning
                                        color={colors.warning}
                                        size={27 * scale}
                                        weight="fill"
                                    />
                                ) : null}
                                {habit.isFocusOfDay ? (
                                    <View
                                        accessible
                                        accessibilityLabel="Focus of the day"
                                    >
                                        <Sun
                                            color={colors.priorityText}
                                            size={24 * scale}
                                            weight="fill"
                                        />
                                    </View>
                                ) : null}
                                <Pressable
                                    accessibilityLabel={`${
                                        habit.isPaused ? 'Resume' : 'Pause'
                                    } ${habit.title}`}
                                    accessibilityRole="button"
                                    onPress={event => {
                                        event.stopPropagation()
                                        onPause()
                                    }}
                                    style={{ padding: 4 * scale }}
                                >
                                    {habit.isPaused ? (
                                        <Play
                                            color={colors.priorityText}
                                            size={27 * scale}
                                            weight="regular"
                                        />
                                    ) : (
                                        <Pause
                                            color={colors.priorityText}
                                            size={27 * scale}
                                            weight="regular"
                                        />
                                    )}
                                </Pressable>
                            </>
                        )}
                    </View>
                </View>
                {habit.isPrerequisiteOnly ? (
                    <Text style={styles.requirementBadge}>
                        Required for another habit
                    </Text>
                ) : null}
                {habit.isBlocked ? (
                    <Text style={styles.blockedText}>
                        Requirement not met:{' '}
                        {habit.blockingHabitTitles.join(', ')}
                    </Text>
                ) : null}
                <Text
                    className="max-w-[72%]"
                    style={[
                        {
                            color:
                                habit.status === 'completed'
                                    ? colors.priorityText
                                    : colors.white,
                            fontFamily: typography.fontFamily,
                            fontSize:
                                (habit.status === 'completed' ? 26 : 18) *
                                scale,
                            lineHeight: 26 * scale,
                            marginTop: 21 * scale,
                        },
                        habit.isFocusOfDay
                            ? styles.focusText
                            : styles.semiboldText,
                    ]}
                >
                    {habit.status === 'completed'
                        ? 'Completed'
                        : habit.description?.trim() || 'No description given'}
                </Text>
                <View
                    className="absolute flex-row items-center"
                    style={{
                        bottom: 22 * scale,
                        right: 22 * scale,
                    }}
                >
                    <Flame
                        color={colors.priorityText}
                        size={39 * scale}
                        weight="regular"
                    />
                    <Text
                        accessibilityLabel={`Streak ${habit.currentStreak} for ${habit.title}`}
                        className="font-normal"
                        style={{
                            color: habit.isFocusOfDay
                                ? colors.priorityText
                                : colors.white,
                            fontFamily: typography.fontFamily,
                            fontSize: 42 * scale,
                            marginLeft: 7 * scale,
                        }}
                    >
                        {habit.currentStreak}
                    </Text>
                </View>
            </Pressable>
        </Animated.View>
    )
    return (
        <PanGestureHandler
            activeOffsetY={[-10, 10]}
            enabled={!isCommittingReorder}
            onEnded={event => {
                const translationY = Number(event.nativeEvent.translationY)
                handleGestureEnd(
                    Number.isFinite(translationY)
                        ? translationY
                        : lastTranslationY.current,
                )
            }}
            onGestureEvent={handleGestureEvent}
        >
            {content}
        </PanGestureHandler>
    )
}

const styles = StyleSheet.create({
    focusText: { color: colors.priorityText, fontWeight: '400' },
    semiboldText: { fontWeight: '600' },
    celebrationLayer: {
        bottom: 0,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,
        zIndex: 3,
    },
    requirementBadge: {
        color: colors.priorityText,
        fontFamily: typography.fontFamily,
        fontSize: 12,
        fontWeight: '600',
        marginTop: 10,
    },
    blockedText: {
        color: colors.priorityText,
        fontFamily: typography.fontFamily,
        fontSize: 13,
        fontWeight: '600',
        marginTop: 8,
    },
    headerActions: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    celebrationParticle: {
        borderRadius: 4,
        height: 8,
        position: 'absolute',
        width: 8,
    },
})
