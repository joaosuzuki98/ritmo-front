import { useEffect, useRef, useState } from 'react'
import Animated, {
    FadeOut,
    LinearTransition,
    ZoomIn,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
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
import { CheckCircle, Flame, Pause, Play } from 'phosphor-react-native'
import type { SharedValue } from 'react-native-reanimated'

import type { HabitCardViewData } from '../habitDashboard.types'
import { colors } from '../../../styles/colors'
import { getResponsiveScale } from '../../../styles/responsive'
import { typography } from '../../../styles/typography'

type HabitCardProps = {
    habit: HabitCardViewData
    onPress: () => void
    onPause: () => void
    onComplete: () => void
    onMoveUp: () => void
    onMoveDown: () => void
    onDragEnd: (targetIndex: number) => void
    isDragging: boolean
    index: number
    reducedMotion: boolean
    totalCards: number
    draggedIndex: SharedValue<number>
    dragTranslationY: SharedValue<number>
}

export const HabitCard = ({
    habit,
    onPress,
    onPause,
    onComplete,
    onDragEnd,
    isDragging,
    index,
    reducedMotion,
    totalCards,
    draggedIndex,
    dragTranslationY,
}: HabitCardProps) => {
    const { width } = useWindowDimensions()
    const scale = getResponsiveScale(width)
    const [isGestureDragging, setIsGestureDragging] = useState(false)
    const lastTranslationY = useRef(0)
    const tapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
    const lastTapAt = useRef(0)
    const [showCelebration, setShowCelebration] = useState(false)
    const wasCompleted = useRef(habit.status === 'completed')
    const dragStep = 188 * scale
    const pauseOpacity = useSharedValue(habit.isPaused ? 0.48 : 1)
    useEffect(() => {
        const nextOpacity = habit.isPaused ? 0.48 : 1
        pauseOpacity.value = reducedMotion
            ? nextOpacity
            : withTiming(nextOpacity, { duration: 220 })
    }, [habit.isPaused, pauseOpacity, reducedMotion])
    const visualStyle = useAnimatedStyle(() => ({
        opacity:
            pauseOpacity.value * (isDragging || isGestureDragging ? 0.7 : 1),
    }))
    useEffect(() => {
        if (habit.status === 'completed' && !wasCompleted.current) {
            setShowCelebration(true)
            const timeout = setTimeout(() => setShowCelebration(false), 760)
            wasCompleted.current = true
            return () => clearTimeout(timeout)
        }
        wasCompleted.current = habit.status === 'completed'
    }, [habit.status])
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
            onComplete()
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
        const sourceIndex = draggedIndex.value
        if (sourceIndex < 0)
            return { transform: [{ translateY: withSpring(0) }], zIndex: 0 }

        const targetIndex = Math.max(
            0,
            Math.min(
                totalCards - 1,
                sourceIndex + Math.round(dragTranslationY.value / dragStep),
            ),
        )
        if (index === sourceIndex)
            return {
                transform: [
                    { scale: 1.02 },
                    { translateY: dragTranslationY.value },
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
        const offset = isMovingDown ? -dragStep : isMovingUp ? dragStep : 0
        return {
            transform: [
                {
                    translateY: withSpring(offset, {
                        damping: 18,
                        stiffness: 180,
                    }),
                },
            ],
            zIndex: 0,
        }
    })
    const handleGestureEvent = (event: PanGestureHandlerGestureEvent) => {
        lastTranslationY.current = event.nativeEvent.translationY
        draggedIndex.value = index
        dragTranslationY.value = lastTranslationY.current
        if (Math.abs(lastTranslationY.current) > 8) setIsGestureDragging(true)
    }
    const handleGestureEnd = () => {
        const targetIndex =
            index + Math.round(lastTranslationY.current / dragStep)
        lastTranslationY.current = 0
        draggedIndex.value = -1
        dragTranslationY.value = 0
        setIsGestureDragging(false)
        onDragEnd(targetIndex)
    }
    const content = (
        <Animated.View
            entering={reducedMotion ? undefined : ZoomIn.delay(index * 45)}
            layout={reducedMotion ? undefined : LinearTransition.duration(220)}
            style={[
                {
                    backgroundColor: habit.priorityColor,
                    borderRadius: 16 * scale,
                    borderColor:
                        habit.status === 'completed'
                            ? colors.success
                            : 'transparent',
                    borderWidth: 2,
                    marginBottom: 20 * scale,
                    minHeight: 168 * scale,
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
                accessibilityRole="button"
                onPress={handleCardPress}
                style={{ flex: 1 }}
            >
                <View
                    style={{
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                    }}
                >
                    <Text
                        numberOfLines={1}
                        style={{
                            color: colors.priorityText,
                            flex: 1,
                            fontFamily: typography.fontFamily,
                            fontSize: 20 * scale,
                            fontWeight: '600',
                        }}
                    >
                        {habit.title}
                        {habit.categoryLabel ? ` - ${habit.categoryLabel}` : ''}
                    </Text>
                    <View style={styles.headerActions}>
                        {habit.status === 'completed' ? (
                            <CheckCircle
                                color={colors.success}
                                size={27 * scale}
                                weight="fill"
                            />
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
                    </View>
                </View>
                {habit.description ? (
                    <Text
                        style={{
                            color: colors.white,
                            fontFamily: typography.fontFamily,
                            fontSize: 18 * scale,
                            fontWeight: '600',
                            lineHeight: 26 * scale,
                            marginTop: 21 * scale,
                            maxWidth: '72%',
                        }}
                    >
                        {habit.description}
                    </Text>
                ) : null}
                <View
                    style={{
                        alignItems: 'center',
                        bottom: 22 * scale,
                        flexDirection: 'row',
                        position: 'absolute',
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
                        style={{
                            color: colors.white,
                            fontFamily: typography.fontFamily,
                            fontSize: 42 * scale,
                            fontWeight: '400',
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
            onEnded={handleGestureEnd}
            onGestureEvent={handleGestureEvent}
        >
            {content}
        </PanGestureHandler>
    )
}

const styles = StyleSheet.create({
    celebrationLayer: {
        bottom: 0,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,
        zIndex: 3,
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
