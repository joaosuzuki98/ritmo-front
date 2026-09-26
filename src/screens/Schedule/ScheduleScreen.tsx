import { useState } from 'react'
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native'
import { CalendarBlank, CaretLeft, CaretRight } from 'phosphor-react-native'

import { ScreenLayout } from '../../components/ScreenLayout'
import { ScreenSubtitle } from '../../components/ScreenSubtitle'
import { colors } from '../../styles/colors'
import { getResponsiveScale } from '../../styles/responsive'
import { spacing } from '../../styles/spacing'
import { typography } from '../../styles/typography'
import { CalendarModal } from './components/CalendarModal'
import { AddScheduleItemModal } from './components/AddScheduleItemModal'
import { ScheduleTimeline } from './components/ScheduleTimeline'
import { useScheduleViewModel } from './useScheduleViewModel'

type ScheduleScreenProps = {
    isAddItemModalVisible: boolean
    onCloseAddItemModal: () => void
}

export const ScheduleScreen = ({
    isAddItemModalVisible,
    onCloseAddItemModal,
}: ScheduleScreenProps) => {
    const { width } = useWindowDimensions()
    const scale = getResponsiveScale(width)
    const viewModel = useScheduleViewModel()
    const [isCalendarVisible, setIsCalendarVisible] = useState(false)
    const calendarButtonSize = 24 * scale
    const calendarButtonHitSlop = (spacing.touchTarget - calendarButtonSize) / 2
    const dateButtonOffset =
        ((typography.screenSubtitle.fontSize - spacing.touchTarget) * scale) / 2

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
            level={7}
            onMenuPress={() => undefined}
            onProfilePress={() => undefined}
            totalPoints={27}
            userName="Teste da Silva"
        >
            <ScheduleTimeline
                entries={viewModel.entries}
                getHourLabel={viewModel.getHourLabel}
                selectedDate={viewModel.selectedDate}
            />
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
                isVisible={isAddItemModalVisible}
                onClose={onCloseAddItemModal}
                onCreateItem={data => {
                    viewModel.addScheduleItem(data)
                    onCloseAddItemModal()
                }}
            />
        </ScreenLayout>
    )
}

const styles = StyleSheet.create({
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
