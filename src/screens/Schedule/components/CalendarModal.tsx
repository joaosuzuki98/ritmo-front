import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native'
import { CaretLeft, CaretRight, X } from 'phosphor-react-native'

import {
    dateKey,
    formatMonthLabel,
    getCalendarDays,
} from '../useScheduleViewModel'
import { colors } from '../../../styles/colors'
import { getResponsiveScale } from '../../../styles/responsive'
import { spacing } from '../../../styles/spacing'
import { typography } from '../../../styles/typography'

type CalendarModalProps = {
    isVisible: boolean
    month: Date
    selectedDate: Date
    onChangeMonth: (delta: number) => void
    onClose: () => void
    onSelectDate: (date: Date) => void
}

const weekDayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export const CalendarModal = ({
    isVisible,
    month,
    selectedDate,
    onChangeMonth,
    onClose,
    onSelectDate,
}: CalendarModalProps) => {
    const { width } = useWindowDimensions()
    const scale = getResponsiveScale(width)
    const days = getCalendarDays(month)

    return (
        <Modal
            animationType="fade"
            onRequestClose={onClose}
            transparent
            visible={isVisible}
        >
            <View style={styles.overlay}>
                <Pressable
                    accessibilityLabel="Close calendar"
                    onPress={onClose}
                    style={styles.backdrop}
                />
                <View
                    style={[
                        styles.card,
                        {
                            borderRadius: 22 * scale,
                            padding: spacing.lg * scale,
                            width: Math.min(width - 32 * scale, 390 * scale),
                        },
                    ]}
                >
                    <View style={styles.header}>
                        <Text style={[styles.title, { fontSize: 25 * scale }]}>
                            Choose a day
                        </Text>
                        <Pressable
                            accessibilityLabel="Close calendar"
                            accessibilityRole="button"
                            onPress={onClose}
                            style={styles.closeButton}
                        >
                            <X color={colors.text} size={24 * scale} />
                        </Pressable>
                    </View>
                    <View style={styles.monthHeader}>
                        <Pressable
                            accessibilityLabel="Previous month"
                            onPress={() => onChangeMonth(-1)}
                            style={styles.monthButton}
                        >
                            <CaretLeft color={colors.text} size={24 * scale} />
                        </Pressable>
                        <Text
                            style={[
                                styles.monthTitle,
                                { fontSize: 19 * scale },
                            ]}
                        >
                            {formatMonthLabel(month)}
                        </Text>
                        <Pressable
                            accessibilityLabel="Next month"
                            onPress={() => onChangeMonth(1)}
                            style={styles.monthButton}
                        >
                            <CaretRight color={colors.text} size={24 * scale} />
                        </Pressable>
                    </View>
                    <View style={styles.weekDaysRow}>
                        {weekDayLabels.map((label, index) => (
                            <Text
                                key={`${label}-${index}`}
                                style={[
                                    styles.weekDay,
                                    { fontSize: 12 * scale },
                                ]}
                            >
                                {label}
                            </Text>
                        ))}
                    </View>
                    <View style={styles.daysGrid}>
                        {days.map((date, index) => {
                            if (!date) {
                                return (
                                    <View
                                        key={`empty-${index}`}
                                        style={styles.dayCell}
                                    />
                                )
                            }
                            const isSelected =
                                dateKey(date) === dateKey(selectedDate)
                            return (
                                <Pressable
                                    accessibilityLabel={`Select ${date.toLocaleDateString(
                                        'en-US',
                                        { month: 'long', day: 'numeric' },
                                    )}`}
                                    accessibilityRole="button"
                                    key={dateKey(date)}
                                    onPress={() => onSelectDate(date)}
                                    style={styles.dayCell}
                                >
                                    <View
                                        style={[
                                            styles.dayButton,
                                            {
                                                borderRadius: 20 * scale,
                                                height: 38 * scale,
                                                width: 38 * scale,
                                            },
                                            isSelected && styles.selectedDay,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.dayText,
                                                { fontSize: 15 * scale },
                                                isSelected &&
                                                    styles.selectedDayText,
                                            ]}
                                        >
                                            {date.getDate()}
                                        </Text>
                                    </View>
                                </Pressable>
                            )
                        })}
                    </View>
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'center', padding: spacing.md },
    backdrop: {
        backgroundColor: 'rgba(0, 0, 0, 0.64)',
        bottom: 0,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,
    },
    card: { alignSelf: 'center', backgroundColor: colors.surface },
    header: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    title: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontWeight: '500',
    },
    closeButton: {
        alignItems: 'center',
        height: spacing.touchTarget,
        justifyContent: 'center',
        width: spacing.touchTarget,
    },
    monthHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.md,
    },
    monthButton: {
        alignItems: 'center',
        height: spacing.touchTarget,
        justifyContent: 'center',
        width: spacing.touchTarget,
    },
    monthTitle: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontWeight: '600',
    },
    weekDaysRow: { flexDirection: 'row', marginTop: spacing.sm },
    weekDay: {
        color: colors.textMuted,
        flex: 1,
        fontFamily: typography.fontFamily,
        fontWeight: '600',
        textAlign: 'center',
    },
    daysGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.xs },
    dayCell: {
        alignItems: 'center',
        height: 48,
        justifyContent: 'center',
        width: '14.2857%',
    },
    dayButton: { alignItems: 'center', justifyContent: 'center' },
    selectedDay: { backgroundColor: colors.accent },
    dayText: { color: colors.text, fontFamily: typography.fontFamily },
    selectedDayText: { fontWeight: '700' },
})
