import { useState } from 'react'
import {
    Pressable,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native'
import { CalendarBlank, CaretLeft, CaretRight } from 'phosphor-react-native'

import { ScreenLayout } from '../../components/ScreenLayout'
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

    return (
        <ScreenLayout
            title="Schedule"
            titleAccessory={
                <Pressable
                    accessibilityLabel="Open calendar"
                    accessibilityRole="button"
                    onPress={() => setIsCalendarVisible(true)}
                    style={styles.calendarButton}
                >
                    <CalendarBlank color={colors.text} size={35 * scale} />
                </Pressable>
            }
            subtitle={
                <View style={styles.dateRow}>
                    <Pressable
                        accessibilityLabel="Previous day"
                        onPress={() => viewModel.moveDate(-1)}
                        style={styles.dateButton}
                    >
                        <CaretLeft color={colors.text} size={34 * scale} />
                    </Pressable>
                    <Text
                        style={[
                            styles.dateText,
                            {
                                fontSize:
                                    typography.screenSubtitle.fontSize * scale,
                            },
                        ]}
                    >
                        {viewModel.formatScheduleDate(viewModel.selectedDate)}
                    </Text>
                    <Pressable
                        accessibilityLabel="Next day"
                        onPress={() => viewModel.moveDate(1)}
                        style={styles.dateButton}
                    >
                        <CaretRight color={colors.text} size={34 * scale} />
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
        alignItems: 'center',
        height: spacing.touchTarget,
        justifyContent: 'center',
        marginLeft: spacing.sm,
        width: spacing.touchTarget,
    },
    dateRow: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.xs,
        width: 280,
    },
    dateButton: {
        alignItems: 'center',
        height: spacing.touchTarget,
        justifyContent: 'center',
        width: spacing.touchTarget,
    },
    dateText: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontWeight: '300',
    },
})
