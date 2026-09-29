import { useEffect, useState } from 'react'
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native'
import { CaretLeft, CaretRight, X } from 'phosphor-react-native'

import { colors } from '../../../styles/colors'
import { getResponsiveScale } from '../../../styles/responsive'
import { spacing } from '../../../styles/spacing'
import { typography } from '../../../styles/typography'

type MonthYearModalProps = {
    isVisible: boolean
    selectedMonth: Date
    onClose: () => void
    onSelectMonth: (month: Date) => void
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

export const MonthYearModal = ({
    isVisible,
    selectedMonth,
    onClose,
    onSelectMonth,
}: MonthYearModalProps) => {
    const { width } = useWindowDimensions()
    const scale = getResponsiveScale(width)
    const [year, setYear] = useState(selectedMonth.getFullYear())

    useEffect(() => {
        if (isVisible) setYear(selectedMonth.getFullYear())
    }, [isVisible, selectedMonth])

    return (
        <Modal
            animationType="fade"
            onRequestClose={onClose}
            transparent
            visible={isVisible}
        >
            <View style={styles.overlay}>
                <Pressable
                    accessibilityLabel="Close month selector"
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
                            Choose a month
                        </Text>
                        <Pressable
                            accessibilityLabel="Close month selector"
                            accessibilityRole="button"
                            onPress={onClose}
                            style={styles.closeButton}
                        >
                            <X color={colors.text} size={24 * scale} />
                        </Pressable>
                    </View>

                    <View style={styles.yearHeader}>
                        <Pressable
                            accessibilityLabel="Previous year"
                            accessibilityRole="button"
                            onPress={() => setYear(current => current - 1)}
                            style={styles.yearButton}
                        >
                            <CaretLeft color={colors.text} size={24 * scale} />
                        </Pressable>
                        <Text style={[styles.year, { fontSize: 20 * scale }]}>
                            {year}
                        </Text>
                        <Pressable
                            accessibilityLabel="Next year"
                            accessibilityRole="button"
                            onPress={() => setYear(current => current + 1)}
                            style={styles.yearButton}
                        >
                            <CaretRight color={colors.text} size={24 * scale} />
                        </Pressable>
                    </View>

                    <View style={styles.monthGrid}>
                        {monthNames.map((month, index) => {
                            const isSelected =
                                selectedMonth.getFullYear() === year &&
                                selectedMonth.getMonth() === index

                            return (
                                <Pressable
                                    accessibilityLabel={`Select ${month} ${year}`}
                                    accessibilityRole="button"
                                    accessibilityState={{
                                        selected: isSelected,
                                    }}
                                    key={month}
                                    onPress={() =>
                                        onSelectMonth(new Date(year, index, 1))
                                    }
                                    style={[
                                        styles.monthButton,
                                        { height: 48 * scale },
                                        isSelected && styles.selectedMonth,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.monthText,
                                            { fontSize: 15 * scale },
                                            isSelected &&
                                                styles.selectedMonthText,
                                        ]}
                                    >
                                        {month}
                                    </Text>
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
    yearHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.md,
    },
    yearButton: {
        alignItems: 'center',
        height: spacing.touchTarget,
        justifyContent: 'center',
        width: spacing.touchTarget,
    },
    year: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontWeight: '600',
    },
    monthGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: spacing.sm,
    },
    monthButton: {
        alignItems: 'center',
        borderRadius: spacing.md,
        justifyContent: 'center',
        width: '33.3333%',
    },
    selectedMonth: { backgroundColor: colors.accent },
    monthText: {
        color: colors.text,
        fontFamily: typography.fontFamily,
    },
    selectedMonthText: { fontWeight: '700' },
})
