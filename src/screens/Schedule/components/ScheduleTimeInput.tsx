import { Controller, type Control } from 'react-hook-form'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import type { AddScheduleItemFormData } from '../addScheduleItemSchema'
import { colors } from '../../../styles/colors'
import { typography } from '../../../styles/typography'

type ScheduleTimeInputProps = {
    accessibilityLabel: string
    control: Control<AddScheduleItemFormData>
    hourName: 'startHour' | 'endHour'
    periodName: 'startPeriod' | 'endPeriod'
}

export const ScheduleTimeInput = ({
    accessibilityLabel,
    control,
    hourName,
    periodName,
}: ScheduleTimeInputProps) => (
    <>
        <View style={styles.row}>
            <Controller
                control={control}
                name={hourName}
                render={({ field, fieldState }) => (
                    <TextInput
                        accessibilityLabel={accessibilityLabel}
                        keyboardType="number-pad"
                        maxLength={2}
                        onBlur={() => {
                            field.onBlur()
                            if (field.value)
                                field.onChange(field.value.padStart(2, '0'))
                        }}
                        onChangeText={value => {
                            const digits = value.replace(/\D/g, '')
                            if (digits && Number(digits) > 12) return
                            field.onChange(digits)
                        }}
                        placeholder="08"
                        placeholderTextColor={colors.textMuted}
                        style={[styles.input, fieldState.error && styles.error]}
                        value={field.value}
                    />
                )}
            />
            <Text style={styles.minutes}>:00</Text>
            <Controller
                control={control}
                name={periodName}
                render={({ field }) => (
                    <View style={styles.periods}>
                        {(['AM', 'PM'] as const).map(period => {
                            const isSelected = field.value === period
                            return (
                                <Pressable
                                    accessibilityLabel={`Select ${period}`}
                                    accessibilityRole="radio"
                                    accessibilityState={{
                                        selected: isSelected,
                                    }}
                                    key={period}
                                    onPress={() => field.onChange(period)}
                                    style={[
                                        styles.period,
                                        isSelected && styles.periodSelected,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.periodText,
                                            isSelected &&
                                                styles.periodTextSelected,
                                        ]}
                                    >
                                        {period}
                                    </Text>
                                </Pressable>
                            )
                        })}
                    </View>
                )}
            />
        </View>
        <Controller
            control={control}
            name={hourName}
            render={({ fieldState }) =>
                fieldState.error ? (
                    <Text style={styles.errorText}>
                        {fieldState.error.message}
                    </Text>
                ) : (
                    <View />
                )
            }
        />
    </>
)

const styles = StyleSheet.create({
    row: { alignItems: 'center', flexDirection: 'row', gap: 4 },
    input: {
        backgroundColor: colors.surfaceInput,
        borderRadius: 8,
        color: colors.text,
        flex: 1,
        fontFamily: typography.fontFamily,
        fontSize: 17,
        minHeight: 54,
        minWidth: 32,
        paddingHorizontal: 8,
        paddingVertical: 12,
        textAlign: 'center',
    },
    error: { borderColor: colors.danger, borderWidth: 1 },
    minutes: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 17,
    },
    periods: { flexDirection: 'row', gap: 3 },
    period: {
        alignItems: 'center',
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.border,
        borderRadius: 6,
        borderWidth: 1,
        justifyContent: 'center',
        minHeight: 40,
        minWidth: 36,
        paddingHorizontal: 3,
    },
    periodSelected: {
        backgroundColor: colors.accent,
        borderColor: colors.accentStrong,
    },
    periodText: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 11,
    },
    periodTextSelected: { color: colors.text },
    errorText: {
        color: colors.danger,
        fontFamily: typography.fontFamily,
        fontSize: 12,
        marginTop: 5,
    },
})
