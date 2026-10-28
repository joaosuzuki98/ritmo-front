import {
    Pressable,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native'
import { Check } from 'phosphor-react-native'

import { BottomSheetLayout } from '../../../components/BottomSheetLayout'
import { theme } from '../../../styles/theme'
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
        <BottomSheetLayout
            backdropColor={theme.colors.bottomSheetBackdropDim}
            closeAccessibilityLabel="Close habit picker"
            closeIconSize={theme.bottomSheet.smallCloseIconSize}
            heightMode="auto"
            isVisible={isVisible}
            onClose={onClose}
            sheetStyle={[
                styles.sheet,
                {
                    borderTopLeftRadius:
                        theme.bottomSheet.compactCornerRadius * scale,
                    borderTopRightRadius:
                        theme.bottomSheet.compactCornerRadius * scale,
                },
            ]}
            shouldAvoidKeyboard={false}
            title="Link a habit"
            titleStyle={{
                fontSize: theme.bottomSheet.pickerTitle.fontSize * scale,
                fontWeight: theme.bottomSheet.pickerTitle.fontWeight,
            }}
            subtitle={
                <Text style={[styles.subtitle, { fontSize: 14 * scale }]}>
                    Choose a habit for {hourLabel}
                </Text>
            }
        >
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
                        <Check color={colors.textMuted} size={22 * scale} />
                    </Pressable>
                ))}
            </View>
        </BottomSheetLayout>
    )
}

const styles = StyleSheet.create({
    sheet: {
        paddingBottom: 28,
        paddingTop: 22,
    },
    subtitle: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        marginTop: 2,
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
