import { useState } from 'react'
import DateTimePicker, {
    DateTimePickerAndroid,
} from '@react-native-community/datetimepicker'
import { useController, type Control } from 'react-hook-form'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'

import type { AddScheduleItemFormData } from '../addScheduleItemSchema'
import { colors } from '../../../styles/colors'
import { globalStyles } from '../../../styles/globalStyles'
import { typography } from '../../../styles/typography'
import { getScheduleHour, getScheduleTimeParts } from '../scheduleTime'

type ScheduleTimeInputProps = {
    accessibilityLabel: string
    control: Control<AddScheduleItemFormData>
    hourName: 'startHour' | 'endHour'
    minuteName: 'startMinute' | 'endMinute'
    periodName: 'startPeriod' | 'endPeriod'
}

export const ScheduleTimeInput = ({
    accessibilityLabel,
    control,
    hourName,
    minuteName,
    periodName,
}: ScheduleTimeInputProps) => {
    const [isPickerVisible, setIsPickerVisible] = useState(false)
    const { field: hourField, fieldState } = useController({
        control,
        name: hourName,
    })
    const { field: minuteField } = useController({
        control,
        name: minuteName,
    })
    const { field: periodField } = useController({
        control,
        name: periodName,
    })

    const getTimeValue = () => {
        const value = new Date()
        value.setHours(
            getScheduleHour(hourField.value, periodField.value),
            Number(minuteField.value),
            0,
            0,
        )
        return value
    }

    const handleTimeChange = (date: Date) => {
        const timeParts = getScheduleTimeParts(date.getHours())
        hourField.onChange(timeParts.hour)
        minuteField.onChange(String(date.getMinutes()).padStart(2, '0'))
        periodField.onChange(timeParts.period)
    }

    const handleOpenPicker = () => {
        if (Platform.OS === 'android') {
            DateTimePickerAndroid.open({
                display: 'clock',
                is24Hour: false,
                mode: 'time',
                onValueChange: (_event, date) => handleTimeChange(date),
                value: getTimeValue(),
            })
            return
        }

        setIsPickerVisible(visible => !visible)
    }

    return (
        <View>
            <Pressable
                accessibilityLabel={accessibilityLabel}
                accessibilityRole="button"
                onPress={handleOpenPicker}
                style={styles.timeButton}
            >
                <Text
                    style={[
                        styles.timeText,
                        fieldState.error && styles.timeTextError,
                    ]}
                >
                    {getTimeValue().toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                    })}
                </Text>
            </Pressable>
            {Platform.OS === 'ios' && isPickerVisible ? (
                <DateTimePicker
                    display="spinner"
                    mode="time"
                    onValueChange={(_event, date) => handleTimeChange(date)}
                    value={getTimeValue()}
                />
            ) : null}
            {fieldState.error ? (
                <Text style={[globalStyles.formErrorText, styles.errorText]}>
                    {fieldState.error.message}
                </Text>
            ) : null}
        </View>
    )
}

const styles = StyleSheet.create({
    timeButton: {
        backgroundColor: colors.surfaceInput,
        borderRadius: 4,
        justifyContent: 'center',
        minHeight: 40,
        paddingHorizontal: 10,
    },
    timeText: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 14,
    },
    timeTextError: { color: colors.danger },
    errorText: { marginTop: 5 },
})
