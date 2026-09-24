import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native'
import { Check, X } from 'phosphor-react-native'

import type { ScheduleHabit } from '../schedule.types'
import { colors } from '../../../styles/colors'
import { getResponsiveScale } from '../../../styles/responsive'
import { spacing } from '../../../styles/spacing'
import { typography } from '../../../styles/typography'

type LinkHabitModalProps = {
    hourLabel: string
    habits: ScheduleHabit[]
    isVisible: boolean
    onClose: () => void
    onSelectHabit: (habitId: string) => void
}

export const LinkHabitModal = ({
    hourLabel,
    habits,
    isVisible,
    onClose,
    onSelectHabit,
}: LinkHabitModalProps) => {
    const { width } = useWindowDimensions()
    const scale = getResponsiveScale(width)

    return (
        <Modal
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent
            transparent
            visible={isVisible}
        >
            <View style={styles.overlay}>
                <Pressable
                    accessibilityLabel="Close habit picker"
                    onPress={onClose}
                    style={styles.backdrop}
                />
                <View
                    style={[
                        styles.sheet,
                        {
                            borderTopLeftRadius: 26 * scale,
                            borderTopRightRadius: 26 * scale,
                            paddingHorizontal: spacing.lg * scale,
                        },
                    ]}
                >
                    <View style={styles.header}>
                        <View>
                            <Text
                                style={[styles.title, { fontSize: 29 * scale }]}
                            >
                                Link a habit
                            </Text>
                            <Text
                                style={[
                                    styles.subtitle,
                                    { fontSize: 14 * scale },
                                ]}
                            >
                                Choose a habit for {hourLabel}
                            </Text>
                        </View>
                        <Pressable
                            accessibilityLabel="Close habit picker"
                            accessibilityRole="button"
                            onPress={onClose}
                            style={styles.closeButton}
                        >
                            <X color={colors.text} size={25 * scale} />
                        </Pressable>
                    </View>
                    <View style={styles.list}>
                        {habits.map(habit => (
                            <Pressable
                                accessibilityLabel={`Link ${habit.title}`}
                                accessibilityRole="button"
                                key={habit.id}
                                onPress={() => onSelectHabit(habit.id)}
                                style={styles.habitRow}
                            >
                                <View style={styles.habitCopy}>
                                    <Text
                                        style={[
                                            styles.habitTitle,
                                            { fontSize: 17 * scale },
                                        ]}
                                    >
                                        {habit.title}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.habitDescription,
                                            { fontSize: 12 * scale },
                                        ]}
                                    >
                                        {habit.description}
                                    </Text>
                                </View>
                                <Check
                                    color={colors.textMuted}
                                    size={22 * scale}
                                />
                            </Pressable>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: {
        backgroundColor: 'rgba(0, 0, 0, 0.62)',
        bottom: 0,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,
    },
    sheet: {
        backgroundColor: colors.background,
        borderTopColor: colors.border,
        borderTopWidth: 1,
        paddingBottom: 28,
        paddingTop: 22,
    },
    header: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    title: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontWeight: '400',
    },
    subtitle: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        marginTop: 2,
    },
    closeButton: {
        alignItems: 'center',
        height: spacing.touchTarget,
        justifyContent: 'center',
        width: spacing.touchTarget,
    },
    list: { marginTop: spacing.lg },
    habitRow: {
        alignItems: 'center',
        backgroundColor: colors.surfaceMuted,
        borderRadius: 12,
        flexDirection: 'row',
        marginBottom: spacing.sm,
        minHeight: 70,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    habitCopy: { flex: 1, paddingRight: spacing.sm },
    habitTitle: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontWeight: '600',
    },
    habitDescription: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        marginTop: 3,
    },
})
