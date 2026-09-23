import Animated, { ZoomIn } from 'react-native-reanimated'
import { PanGestureHandler } from 'react-native-gesture-handler'
import type { PanGestureHandlerGestureEvent } from 'react-native-gesture-handler'
import { useRef, useState } from 'react'
import { Pressable, Text, View, useWindowDimensions } from 'react-native'
import { Flame, Pause } from 'phosphor-react-native'
import { useAnimatedStyle, withSpring } from 'react-native-reanimated'
import type { SharedValue } from 'react-native-reanimated'

import type { HabitCardViewData } from '../habitDashboard.types'
import { colors } from '../../../styles/colors'
import { getResponsiveScale } from '../../../styles/responsive'
import { typography } from '../../../styles/typography'

type HabitCardProps = {
    habit: HabitCardViewData
    onPress: () => void
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
    const dragStep = 188 * scale
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
            style={[
                {
                    backgroundColor: habit.priorityColor,
                    borderRadius: 16 * scale,
                    marginBottom: 20 * scale,
                    minHeight: 168 * scale,
                    opacity: isDragging || isGestureDragging ? 0.7 : 1,
                    paddingHorizontal: 24 * scale,
                    paddingVertical: 18 * scale,
                },
                dragStyle,
            ]}
        >
            <Pressable
                accessibilityLabel={`Open details for ${habit.title}`}
                accessibilityRole="button"
                onPress={onPress}
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
                    <Pressable
                        accessibilityLabel={`Pause ${habit.title}`}
                        accessibilityRole="button"
                        onPress={() => undefined}
                        style={{ padding: 4 * scale }}
                    >
                        <Pause
                            color={colors.priorityText}
                            size={27 * scale}
                            weight="regular"
                        />
                    </Pressable>
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
