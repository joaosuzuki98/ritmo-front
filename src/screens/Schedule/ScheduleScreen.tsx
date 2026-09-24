import { useState } from 'react'
import {
    Pressable,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native'
import {
    CalendarBlank,
    CaretLeft,
    CaretRight,
    Link,
} from 'phosphor-react-native'

import { TopBar } from '../../components/TopBar'
import { colors } from '../../styles/colors'
import { globalStyles } from '../../styles/globalStyles'
import { getResponsiveScale } from '../../styles/responsive'
import { spacing } from '../../styles/spacing'
import { typography } from '../../styles/typography'
import { CalendarModal } from './components/CalendarModal'
import { LinkHabitModal } from './components/LinkHabitModal'
import { ScheduleTimeline } from './components/ScheduleTimeline'
import { useScheduleViewModel } from './useScheduleViewModel'

export const ScheduleScreen = () => {
    const { width } = useWindowDimensions()
    const scale = getResponsiveScale(width)
    const viewModel = useScheduleViewModel()
    const [isCalendarVisible, setIsCalendarVisible] = useState(false)
    const [linkHour, setLinkHour] = useState(-1)

    const openLinkModal = (hour: number) => setLinkHour(hour)
    const closeLinkModal = () => setLinkHour(-1)
    const handleSelectHabit = (habitId: string) => {
        viewModel.linkHabit(habitId, linkHour)
        closeLinkModal()
    }

    return (
        <View style={globalStyles.screen}>
            <TopBar
                level={7}
                onMenuPress={() => undefined}
                onProfilePress={() => undefined}
                totalPoints={27}
                userName="Teste da Silva"
            />
            <View style={[styles.header, { paddingTop: 30 * scale }]}>
                <View style={styles.titleRow}>
                    <Text style={[styles.title, { fontSize: 52 * scale }]}>
                        Schedule
                    </Text>
                    <Pressable
                        accessibilityLabel="Open calendar"
                        accessibilityRole="button"
                        onPress={() => setIsCalendarVisible(true)}
                        style={styles.calendarButton}
                    >
                        <CalendarBlank color={colors.text} size={35 * scale} />
                    </Pressable>
                </View>
                <View style={styles.dateRow}>
                    <Pressable
                        accessibilityLabel="Previous day"
                        onPress={() => viewModel.moveDate(-1)}
                        style={styles.dateButton}
                    >
                        <CaretLeft color={colors.text} size={34 * scale} />
                    </Pressable>
                    <Text style={[styles.dateText, { fontSize: 34 * scale }]}>
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
                <Pressable
                    accessibilityLabel="Link a habit"
                    accessibilityRole="button"
                    onPress={() => openLinkModal(8)}
                    style={[styles.linkButton, { marginBottom: 18 * scale }]}
                >
                    <Link color={colors.text} size={18 * scale} />
                    <Text
                        style={[
                            styles.linkButtonText,
                            { fontSize: 14 * scale },
                        ]}
                    >
                        Link a habit
                    </Text>
                </Pressable>
            </View>
            <ScheduleTimeline
                entries={viewModel.entries}
                getHourLabel={viewModel.getHourLabel}
                onOpenLink={openLinkModal}
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
            <LinkHabitModal
                habits={viewModel.availableHabits}
                hourLabel={viewModel.getHourLabel(Math.max(0, linkHour))}
                isVisible={linkHour >= 0}
                onClose={closeLinkModal}
                onSelectHabit={handleSelectHabit}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.md,
    },
    titleRow: { alignItems: 'center', flexDirection: 'row' },
    title: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontWeight: '500',
    },
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
    linkButton: {
        alignItems: 'center',
        backgroundColor: colors.accent,
        borderRadius: 18,
        flexDirection: 'row',
        gap: spacing.xs,
        marginTop: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
    },
    linkButtonText: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontWeight: '600',
    },
})
