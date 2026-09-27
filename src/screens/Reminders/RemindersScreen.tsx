import { useState } from 'react'
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native'
import { CalendarBlank, CaretLeft, CaretRight } from 'phosphor-react-native'

import { ScreenLayout } from '../../components/ScreenLayout'
import { ScreenSubtitle } from '../../components/ScreenSubtitle'
import { colors } from '../../styles/colors'
import { getResponsiveScale } from '../../styles/responsive'
import { spacing } from '../../styles/spacing'
import { typography } from '../../styles/typography'
import type { Event } from '../../database'
import { AddScheduleItemModal } from '../Schedule/components/AddScheduleItemModal'
import { MonthYearModal } from './components/MonthYearModal'
import { useRemindersViewModel } from './useRemindersViewModel'

type RemindersScreenProps = {
    isAddEventModalVisible: boolean
    onMenuPress?: () => void
    onCloseAddEventModal: () => void
}

const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
]

const formatEventDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const time = `${date.getHours()}:${String(date.getMinutes()).padStart(
        2,
        '0',
    )}`
    return `${year}/${month}/${day}, ${time}`
}

export const RemindersScreen = ({
    isAddEventModalVisible,
    onMenuPress = () => undefined,
    onCloseAddEventModal,
}: RemindersScreenProps) => {
    const { width } = useWindowDimensions()
    const scale = getResponsiveScale(width)
    const viewModel = useRemindersViewModel()
    const [editingEvent, setEditingEvent] = useState<Event | null>(null)
    const [isMonthYearModalVisible, setIsMonthYearModalVisible] =
        useState(false)

    return (
        <ScreenLayout
            title="Reminders"
            subtitle={
                <ScreenSubtitle>Keep track of important dates</ScreenSubtitle>
            }
            level={7}
            onMenuPress={onMenuPress}
            onProfilePress={() => undefined}
            totalPoints={27}
            userName="Teste da Silva"
        >
            <ScrollView
                contentContainerStyle={[
                    styles.content,
                    {
                        paddingHorizontal: 28 * scale,
                        paddingBottom: 28 * scale,
                    },
                ]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.calendarHeader}>
                    <View
                        style={[
                            styles.monthControls,
                            { marginLeft: -spacing.md * scale },
                        ]}
                    >
                        <Pressable
                            accessibilityLabel="Previous month"
                            onPress={() => viewModel.moveMonth(-1)}
                            style={styles.monthArrow}
                        >
                            <CaretLeft
                                color={colors.textMuted}
                                size={24 * scale}
                            />
                        </Pressable>
                        <Text
                            style={[
                                styles.monthTitle,
                                { fontSize: 25 * scale },
                            ]}
                        >
                            {monthNames[viewModel.visibleMonth.getMonth()]}
                        </Text>
                        <Pressable
                            accessibilityLabel="Next month"
                            onPress={() => viewModel.moveMonth(1)}
                            style={styles.monthArrow}
                        >
                            <CaretRight
                                color={colors.textMuted}
                                size={24 * scale}
                            />
                        </Pressable>
                    </View>
                    <View style={styles.yearRow}>
                        <Pressable
                            accessibilityLabel="Choose month and year"
                            accessibilityRole="button"
                            onPress={() => setIsMonthYearModalVisible(true)}
                            style={styles.calendarButton}
                        >
                            <CalendarBlank
                                color={colors.textMuted}
                                size={24 * scale}
                            />
                        </Pressable>
                        <Text style={[styles.year, { fontSize: 25 * scale }]}>
                            {viewModel.visibleMonth.getFullYear()}
                        </Text>
                    </View>
                </View>

                <View style={styles.weekDays}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                        <Text key={`${day}-${index}`} style={styles.weekDay}>
                            {day}
                        </Text>
                    ))}
                </View>
                <View style={styles.calendarGrid}>
                    {viewModel.calendarDays.map((day, index) => {
                        const hasEvent =
                            day !== null &&
                            viewModel.events.some(
                                event =>
                                    event.dateTime.getFullYear() ===
                                        viewModel.visibleMonth.getFullYear() &&
                                    event.dateTime.getMonth() ===
                                        viewModel.visibleMonth.getMonth() &&
                                    event.dateTime.getDate() === day,
                            )
                        const isSelected =
                            day !== null &&
                            viewModel.selectedDate.getFullYear() ===
                                viewModel.visibleMonth.getFullYear() &&
                            viewModel.selectedDate.getMonth() ===
                                viewModel.visibleMonth.getMonth() &&
                            viewModel.selectedDate.getDate() === day

                        return (
                            <Pressable
                                key={`day-${index}`}
                                accessibilityLabel={
                                    day ? `Select day ${day}` : undefined
                                }
                                accessibilityRole={day ? 'button' : undefined}
                                accessibilityState={
                                    day ? { selected: isSelected } : undefined
                                }
                                disabled={day === null}
                                onPress={() => day && viewModel.selectDay(day)}
                                style={[
                                    styles.dayCell,
                                    { minHeight: 56 * scale },
                                    isSelected && styles.selectedDay,
                                ]}
                            >
                                {day ? (
                                    <>
                                        <Text
                                            style={[
                                                styles.dayText,
                                                { fontSize: 17 * scale },
                                                isSelected &&
                                                    styles.selectedDayText,
                                            ]}
                                        >
                                            {day}
                                        </Text>
                                        {hasEvent ? (
                                            <View style={styles.eventDot} />
                                        ) : null}
                                    </>
                                ) : null}
                            </Pressable>
                        )
                    })}
                </View>

                <View style={[styles.section, { marginTop: 36 * scale }]}>
                    <Text
                        style={[styles.sectionTitle, { fontSize: 21 * scale }]}
                    >
                        Upcoming events
                    </Text>
                    {viewModel.eventsForSelectedDate.map(event => (
                        <Pressable
                            accessibilityLabel={`Edit event ${event.title}`}
                            accessibilityRole="button"
                            key={event.id}
                            onPress={() => setEditingEvent(event)}
                            style={styles.eventCard}
                        >
                            <Text
                                style={[
                                    styles.eventText,
                                    { fontSize: 16 * scale },
                                ]}
                            >
                                {formatEventDate(event.dateTime)} -{' '}
                                {event.title}
                            </Text>
                            {event.location ? (
                                <Text
                                    style={[
                                        styles.eventDetail,
                                        { fontSize: 14 * scale },
                                    ]}
                                >
                                    {event.location}
                                </Text>
                            ) : null}
                            {event.description ? (
                                <Text
                                    style={[
                                        styles.eventDetail,
                                        { fontSize: 14 * scale },
                                    ]}
                                >
                                    {event.description}
                                </Text>
                            ) : null}
                        </Pressable>
                    ))}
                    {viewModel.eventsForSelectedDate.length === 0 ? (
                        <Text
                            style={[styles.emptyText, { fontSize: 15 * scale }]}
                        >
                            No events for this day.
                        </Text>
                    ) : null}
                </View>

                <View style={[styles.section, { marginTop: 26 * scale }]}>
                    <Text
                        style={[styles.sectionTitle, { fontSize: 21 * scale }]}
                    >
                        Upcoming holidays
                    </Text>
                    <Text style={[styles.emptyText, { fontSize: 15 * scale }]}>
                        No upcoming holidays.
                    </Text>
                </View>
                <View style={[styles.section, { marginTop: 26 * scale }]}>
                    <Text
                        style={[styles.sectionTitle, { fontSize: 21 * scale }]}
                    >
                        Upcoming important days
                    </Text>
                    <Text style={[styles.emptyText, { fontSize: 15 * scale }]}>
                        No important days yet.
                    </Text>
                </View>
            </ScrollView>
            <MonthYearModal
                isVisible={isMonthYearModalVisible}
                onClose={() => setIsMonthYearModalVisible(false)}
                onSelectMonth={month => {
                    viewModel.selectMonth(month)
                    setIsMonthYearModalVisible(false)
                }}
                selectedMonth={viewModel.visibleMonth}
            />
            <AddScheduleItemModal
                initialStartHour={8}
                isVisible={isAddEventModalVisible || Boolean(editingEvent)}
                item={editingEvent}
                onClose={() => {
                    if (editingEvent) setEditingEvent(null)
                    else onCloseAddEventModal()
                }}
                title={editingEvent ? 'Edit event' : 'Add event'}
                subtitle={
                    editingEvent
                        ? 'Update or remove this reminder.'
                        : 'Choose a time for this reminder.'
                }
                submitLabel={editingEvent ? 'SAVE EVENT' : 'ADD EVENT'}
                showEventDetails
                onCreateItem={viewModel.addEvent}
                onUpdateItem={data =>
                    editingEvent
                        ? viewModel.updateEvent(editingEvent.id, data)
                        : Promise.resolve()
                }
                onDeleteItem={() =>
                    editingEvent
                        ? viewModel.deleteEvent(editingEvent.id)
                        : Promise.resolve()
                }
            />
        </ScreenLayout>
    )
}

const styles = StyleSheet.create({
    content: { paddingTop: 24 },
    calendarHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    monthControls: { alignItems: 'center', flexDirection: 'row' },
    monthArrow: {
        alignItems: 'center',
        height: spacing.touchTarget,
        justifyContent: 'center',
        width: spacing.touchTarget,
    },
    monthTitle: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontWeight: '400',
    },
    yearRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
    calendarButton: {
        alignItems: 'flex-end',
        height: spacing.touchTarget,
        justifyContent: 'center',
        width: spacing.touchTarget,
    },
    year: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontWeight: '500',
    },
    weekDays: { flexDirection: 'row' },
    weekDay: {
        color: colors.textMuted,
        flex: 1,
        fontFamily: typography.fontFamily,
        fontSize: 13,
        paddingBottom: spacing.sm,
        textAlign: 'center',
    },
    calendarGrid: {
        borderColor: colors.border,
        borderLeftWidth: StyleSheet.hairlineWidth,
        borderTopWidth: StyleSheet.hairlineWidth,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        alignItems: 'flex-start',
        borderBottomColor: colors.border,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderRightColor: colors.border,
        borderRightWidth: StyleSheet.hairlineWidth,
        flexBasis: `${100 / 7}%`,
        paddingHorizontal: 7,
        paddingTop: 7,
    },
    selectedDay: { backgroundColor: colors.scheduleBackground },
    dayText: {
        color: colors.text,
        fontFamily: typography.fontFamily,
    },
    selectedDayText: { color: colors.white, fontWeight: '700' },
    eventDot: {
        backgroundColor: colors.success,
        borderRadius: 3,
        height: 6,
        marginTop: 5,
        width: 6,
    },
    section: { gap: spacing.sm },
    sectionTitle: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontWeight: '500',
        marginBottom: 2,
    },
    eventCard: {
        backgroundColor: colors.surfaceMuted,
        borderRadius: 8,
        gap: spacing.xxs,
        padding: spacing.sm,
    },
    eventText: {
        color: colors.text,
        fontFamily: typography.fontFamily,
    },
    eventDetail: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
    },
    emptyText: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
    },
})
