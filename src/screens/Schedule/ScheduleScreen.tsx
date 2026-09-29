import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native'
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated'
import { CalendarBlank, CaretLeft, CaretRight } from 'phosphor-react-native'

import { ScreenLayout } from '../../components/ScreenLayout'
import { ScreenSubtitle } from '../../components/ScreenSubtitle'
import { colors } from '../../styles/colors'
import { getResponsiveScale } from '../../styles/responsive'
import { spacing } from '../../styles/spacing'
import { typography } from '../../styles/typography'
import type { Event, User } from '../../database'
import { CalendarModal } from './components/CalendarModal'
import { AddScheduleItemModal } from './components/AddScheduleItemModal'
import { ScheduleTimeline } from './components/ScheduleTimeline'
import { useScheduleViewModel } from './useScheduleViewModel'

type ScheduleScreenProps = {
    currentUser: User
    isAddItemModalVisible: boolean
    onMenuPress?: () => void
    onCloseAddItemModal: () => void
}

export const ScheduleScreen = ({
    currentUser,
    isAddItemModalVisible,
    onMenuPress = () => undefined,
    onCloseAddItemModal,
}: ScheduleScreenProps) => {
    const { width } = useWindowDimensions()
    const scale = getResponsiveScale(width)
    const viewModel = useScheduleViewModel(currentUser.id)
    const [isCalendarVisible, setIsCalendarVisible] = useState(false)
    const [editingEvent, setEditingEvent] = useState<Event | null>(null)
    const timelineOpacity = useSharedValue(1)
    const timelineTranslationX = useSharedValue(0)
    const calendarButtonSize = 24 * scale
    const calendarButtonHitSlop = (spacing.touchTarget - calendarButtonSize) / 2
    const dateButtonOffset =
        ((typography.screenSubtitle.fontSize - spacing.touchTarget) * scale) / 2
    const timelineAnimationStyle = useAnimatedStyle(() => ({
        opacity: timelineOpacity.value,
        transform: [{ translateX: timelineTranslationX.value }],
    }))

    useEffect(() => {
        timelineOpacity.value = 0.35
        timelineTranslationX.value = 12 * scale
        timelineOpacity.value = withTiming(1, { duration: 220 })
        timelineTranslationX.value = withTiming(0, { duration: 220 })
    }, [scale, viewModel.selectedDate, timelineOpacity, timelineTranslationX])

    return (
        <ScreenLayout
            title="Schedule"
            titleAccessory={
                <Pressable
                    accessibilityLabel="Open calendar"
                    accessibilityRole="button"
                    onPress={() => setIsCalendarVisible(true)}
                    hitSlop={{
                        top: calendarButtonHitSlop,
                        right: calendarButtonHitSlop * 2,
                        bottom: calendarButtonHitSlop,
                        left: 0,
                    }}
                    style={[
                        styles.calendarButton,
                        {
                            height: calendarButtonSize,
                            width: calendarButtonSize,
                        },
                    ]}
                >
                    <CalendarBlank
                        color={colors.textMuted}
                        size={calendarButtonSize}
                    />
                </Pressable>
            }
            subtitle={
                <View
                    style={[
                        styles.dateRow,
                        { width: spacing.dateNavigationWidth * scale },
                    ]}
                >
                    <Pressable
                        accessibilityLabel="Previous day"
                        onPress={() => viewModel.moveDate(-1)}
                        style={[
                            styles.dateButton,
                            styles.previousDateButton,
                            {
                                height: spacing.touchTarget * scale,
                                top: dateButtonOffset,
                                width:
                                    spacing.dateNavigationButtonWidth * scale,
                            },
                        ]}
                    >
                        <CaretLeft color={colors.textMuted} size={24 * scale} />
                    </Pressable>
                    <View style={styles.dateSubtitle}>
                        <ScreenSubtitle>
                            {viewModel.formatScheduleDate(
                                viewModel.selectedDate,
                            )}
                        </ScreenSubtitle>
                    </View>
                    <Pressable
                        accessibilityLabel="Next day"
                        onPress={() => viewModel.moveDate(1)}
                        style={[
                            styles.dateButton,
                            styles.nextDateButton,
                            {
                                height: spacing.touchTarget * scale,
                                top: dateButtonOffset,
                                width:
                                    spacing.dateNavigationButtonWidth * scale,
                            },
                        ]}
                    >
                        <CaretRight
                            color={colors.textMuted}
                            size={24 * scale}
                        />
                    </Pressable>
                </View>
            }
            level={currentUser.level}
            onMenuPress={onMenuPress}
            onProfilePress={() => undefined}
            totalPoints={currentUser.totalPoints}
            userName={currentUser.name}
        >
            <Animated.View style={[styles.timeline, timelineAnimationStyle]}>
                <ScheduleTimeline
                    entries={viewModel.entries}
                    getHourLabel={viewModel.getHourLabel}
                    onEventPress={eventId => {
                        const event = viewModel.events.find(
                            item => item.id === eventId,
                        )
                        if (event) setEditingEvent(event)
                    }}
                    selectedDate={viewModel.selectedDate}
                />
            </Animated.View>
            <CalendarModal
                isVisible={isCalendarVisible}
                month={viewModel.calendarMonth}
                onChangeMonth={viewModel.moveCalendarMonth}
                onClose={() => setIsCalendarVisible(false)}
                onSelectDate={date => {
                    viewModel.selectDate(date)
                    setIsCalendarVisible(false)
                }}
                selectedDate={viewModel.selectedDate}
            />
            <AddScheduleItemModal
                initialStartHour={8}
                isVisible={isAddItemModalVisible || Boolean(editingEvent)}
                item={editingEvent}
                onClose={() => {
                    if (editingEvent) setEditingEvent(null)
                    else onCloseAddItemModal()
                }}
                onCreateItem={viewModel.addScheduleItem}
                onUpdateItem={data =>
                    editingEvent
                        ? viewModel.updateScheduleItem(editingEvent.id, data)
                        : Promise.resolve()
                }
                onDeleteItem={() =>
                    editingEvent
                        ? viewModel.deleteScheduleItem(editingEvent.id)
                        : Promise.resolve()
                }
            />
        </ScreenLayout>
    )
}

const styles = StyleSheet.create({
    timeline: { flex: 1 },
    calendarButton: {
        justifyContent: 'center',
        marginLeft: spacing.sm,
    },
    dateRow: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dateSubtitle: { alignItems: 'center', flex: 1 },
    dateButton: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
    },
    previousDateButton: { left: 0 },
    nextDateButton: { right: 0 },
})
