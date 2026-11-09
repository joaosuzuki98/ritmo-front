import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import DateTimePicker, {
    DateTimePickerAndroid,
} from '@react-native-community/datetimepicker'
import { Picker } from '@react-native-picker/picker'
import { Controller, useForm } from 'react-hook-form'
import {
    Pressable,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native'
import { BottomSheetLayout } from '../../../components/BottomSheetLayout'
import { theme } from '../../../styles/theme'

import {
    incompletionReasonOptions,
    type IncompletionReasonCode,
} from '../../../constants/incompletionReasons'
import { localDateKey } from '../../../utils/normalizeLocalDate'
import { formatPreferredTime, parsePreferredTime } from '../preferredTime'
import { FormActionButton } from '../../../components/FormActionButton'
import { FormTextInput } from '../../../components/FormTextInput'
import { colors } from '../../../styles/colors'
import { globalStyles } from '../../../styles/globalStyles'
import { getResponsiveScale } from '../../../styles/responsive'
import { spacing } from '../../../styles/spacing'
import { typography } from '../../../styles/typography'
import type { HabitCardViewData } from '../habitDashboard.types'
import {
    logHabitProgressSchema,
    type LogHabitProgressFormData,
} from '../logHabitProgressSchema'
import { useTranslation } from '../../../localization/useTranslation'
import { useFocusedInputScroll } from '../../../hooks/useFocusedInputScroll'

type LogHabitProgressModalProps = {
    habit: HabitCardViewData | null
    isVisible: boolean
    selectedDate?: Date
    onClose: () => void
    onSave: (
        habitId: string,
        data: LogHabitProgressFormData,
    ) => Promise<boolean | void>
}

const getInitialValues = (
    habit: HabitCardViewData | null,
    selectedDate = new Date(),
): LogHabitProgressFormData => {
    const selectedKey = localDateKey(selectedDate)
    const record = habit?.completionHistory.find(
        item => localDateKey(item.date) === selectedKey,
    )
    const time = record?.completionTime ?? new Date()
    const status = record?.status
    const reason = incompletionReasonOptions.find(
        option => option.label === record?.incompletionReason,
    )?.value

    return {
        status:
            status === 'partial' || status === 'skipped' ? status : 'completed',
        time: `${String(time.getHours()).padStart(2, '0')}:${String(
            time.getMinutes(),
        ).padStart(2, '0')}`,
        reason: reason ?? (record?.incompletionReason ? 'other' : undefined),
        note: record?.note ?? '',
    }
}

const statusOptions = [
    { value: 'completed', label: 'Completed' },
    { value: 'partial', label: 'Partially completed' },
    { value: 'skipped', label: 'Not completed' },
] as const

export const LogHabitProgressModal = ({
    habit,
    isVisible,
    selectedDate,
    onClose,
    onSave,
}: LogHabitProgressModalProps) => {
    const { language, t } = useTranslation()
    const { width } = useWindowDimensions()
    const scale = getResponsiveScale(width)
    const { scrollRef, ensureFocusedInputVisible, handleScroll, resetScroll } =
        useFocusedInputScroll()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')
    const [isTimePickerVisible, setIsTimePickerVisible] = useState(false)
    const {
        control,
        formState: { errors },
        handleSubmit,
        reset,
        setValue,
        watch,
    } = useForm<LogHabitProgressFormData>({
        defaultValues: getInitialValues(habit, selectedDate),
        resolver: zodResolver(logHabitProgressSchema),
    })
    const selectedStatus = watch('status')
    const selectedReason = watch('reason')
    const selectedTime = watch('time')

    useEffect(() => {
        if (isVisible) {
            resetScroll()
            reset(getInitialValues(habit, selectedDate))
            setSubmitError('')
            setIsTimePickerVisible(false)
        }
    }, [habit, isVisible, reset, resetScroll, selectedDate])

    const handleTimeChange = (date: Date) => {
        setValue('time', formatPreferredTime(date), { shouldValidate: true })
    }

    const handleOpenTimePicker = () => {
        if (Platform.OS === 'android') {
            DateTimePickerAndroid.open({
                display: 'clock',
                is24Hour: false,
                minuteInterval: 5,
                mode: 'time',
                onValueChange: (_event, date) => {
                    if (date) handleTimeChange(date)
                },
                value: parsePreferredTime(selectedTime) ?? new Date(),
            })
            return
        }

        setIsTimePickerVisible(visible => !visible)
    }

    const handleSave = async (data: LogHabitProgressFormData) => {
        if (!habit) return
        setIsSubmitting(true)
        setSubmitError('')
        try {
            const saved = await onSave(habit.id, data)
            if (saved !== false) onClose()
        } catch (error) {
            setSubmitError(
                error instanceof Error
                    ? error.message
                    : 'Unable to save progress. Please try again.',
            )
        } finally {
            setIsSubmitting(false)
        }
    }
    const handleFormSubmit = () => handleSubmit(handleSave)()

    return (
        <BottomSheetLayout
            backdropColor={theme.colors.bottomSheetBackdropStrong}
            closeAccessibilityLabel={t('Close progress form')}
            heightRatio={theme.bottomSheet.heightRatio}
            isVisible={isVisible}
            onClose={onClose}
            sheetStyle={styles.sheet}
        >
            <Text style={[styles.title, { fontSize: 28 * scale }]}>
                {t('Record today’s progress')}
            </Text>
            <Text style={styles.habitTitle}>{habit?.title}</Text>
            <ScrollView
                ref={scrollRef}
                keyboardShouldPersistTaps="handled"
                onContentSizeChange={ensureFocusedInputVisible}
                onFocus={ensureFocusedInputVisible}
                onLayout={ensureFocusedInputVisible}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
            >
                <Text style={[globalStyles.formFieldLabel, styles.label]}>
                    {t('How did it go?')}
                </Text>
                <View style={styles.statusPickerContainer}>
                    <Picker
                        accessibilityLabel={t('How did it go?')}
                        dropdownIconColor={colors.textMuted}
                        dropdownIconRippleColor="transparent"
                        mode="dropdown"
                        onValueChange={value =>
                            setValue('status', value, {
                                shouldValidate: true,
                            })
                        }
                        selectedValue={selectedStatus}
                        style={styles.statusPicker}
                    >
                        {statusOptions.map(option => (
                            <Picker.Item
                                key={option.value}
                                label={t(option.label)}
                                style={styles.statusPickerItem}
                                value={option.value}
                            />
                        ))}
                    </Picker>
                </View>

                {selectedStatus !== 'completed' ? (
                    <>
                        <Text
                            style={[globalStyles.formFieldLabel, styles.label]}
                        >
                            {t('What got in the way?')}
                        </Text>
                        <View style={styles.statusOptions}>
                            {incompletionReasonOptions.map(option => {
                                const isSelected =
                                    selectedReason === option.value
                                return (
                                    <Pressable
                                        accessibilityRole="radio"
                                        accessibilityState={{
                                            selected: isSelected,
                                        }}
                                        key={option.value}
                                        onPress={() =>
                                            setValue(
                                                'reason',
                                                option.value as IncompletionReasonCode,
                                                {
                                                    shouldValidate: true,
                                                },
                                            )
                                        }
                                        style={[
                                            styles.statusOption,
                                            isSelected &&
                                                styles.statusOptionSelected,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.statusOptionText,
                                                isSelected &&
                                                    styles.statusOptionTextSelected,
                                            ]}
                                        >
                                            {t(option.label)}
                                        </Text>
                                    </Pressable>
                                )
                            })}
                        </View>
                        {errors.reason ? (
                            <Text
                                style={[
                                    globalStyles.formErrorText,
                                    styles.errorText,
                                ]}
                            >
                                {t(errors.reason.message ?? '')}
                            </Text>
                        ) : null}
                    </>
                ) : null}

                <Text style={[globalStyles.formFieldLabel, styles.label]}>
                    {t('Time')}
                </Text>
                <Pressable
                    accessibilityLabel={t('Time')}
                    accessibilityRole="button"
                    onPress={handleOpenTimePicker}
                    style={styles.timePickerButton}
                >
                    <Text style={styles.timePickerText}>
                        {parsePreferredTime(selectedTime)?.toLocaleTimeString(
                            language === 'pt' ? 'pt-BR' : 'en-US',
                            { hour: 'numeric', minute: '2-digit' },
                        ) ?? selectedTime}
                    </Text>
                </Pressable>
                {Platform.OS === 'ios' && isTimePickerVisible ? (
                    <DateTimePicker
                        display="spinner"
                        minuteInterval={5}
                        mode="time"
                        onValueChange={(_event, date) => handleTimeChange(date)}
                        value={parsePreferredTime(selectedTime) ?? new Date()}
                    />
                ) : null}
                {errors.time ? (
                    <Text
                        style={[globalStyles.formErrorText, styles.errorText]}
                    >
                        {t(errors.time.message ?? '')}
                    </Text>
                ) : null}

                <Text style={[globalStyles.formFieldLabel, styles.label]}>
                    {t('Observation')}
                </Text>
                <Controller
                    control={control}
                    name="note"
                    render={({ field }) => (
                        <FormTextInput
                            accessibilityLabel={t('Progress observation')}
                            multiline
                            onBlur={field.onBlur}
                            onChangeText={field.onChange}
                            onFocus={ensureFocusedInputVisible}
                            placeholder={t('Add a note about today')}
                            scrollEnabled={false}
                            containerStyle={styles.noteContainer}
                            hasError={Boolean(errors.note)}
                            style={styles.noteText}
                            textAlignVertical="top"
                            value={field.value}
                        />
                    )}
                />
                {errors.note ? (
                    <Text
                        style={[globalStyles.formErrorText, styles.errorText]}
                    >
                        {t(errors.note.message ?? '')}
                    </Text>
                ) : null}

                {submitError ? (
                    <Text
                        style={[globalStyles.formErrorText, styles.errorText]}
                    >
                        {t(submitError)}
                    </Text>
                ) : null}
                <FormActionButton
                    accessibilityLabel={t('Save progress')}
                    disabled={isSubmitting}
                    isLoading={isSubmitting}
                    onPress={handleFormSubmit}
                    title={t('Save progress')}
                    containerStyle={styles.saveButton}
                />
            </ScrollView>
        </BottomSheetLayout>
    )
}

const styles = StyleSheet.create({
    sheet: {
        borderColor: colors.border,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        paddingTop: 22,
    },
    title: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontWeight: '500',
    },
    habitTitle: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 16,
        marginTop: 5,
    },
    label: {
        marginTop: 20,
    },
    statusOptions: { gap: 8 },
    timePickerButton: {
        backgroundColor: colors.surfaceInput,
        borderRadius: 4,
        justifyContent: 'center',
        minHeight: 40,
        paddingHorizontal: 12,
    },
    timePickerText: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 15,
    },
    statusPickerContainer: {
        backgroundColor: colors.surfaceInput,
        borderRadius: 4,
        height: 40,
        justifyContent: 'center',
        overflow: 'hidden',
    },
    statusPicker: {
        backgroundColor: colors.surfaceInput,
        color: colors.text,
        fontFamily: typography.fontFamily,
        flexShrink: 0,
    },
    statusPickerItem: {
        backgroundColor: colors.surfaceInput,
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 14,
    },
    statusOption: {
        borderColor: colors.border,
        borderRadius: 9,
        borderWidth: 1,
        justifyContent: 'center',
        minHeight: spacing.touchTarget,
        paddingHorizontal: 14,
    },
    statusOptionSelected: {
        backgroundColor: colors.accent,
        borderColor: colors.accentStrong,
    },
    statusOptionText: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 15,
    },
    statusOptionTextSelected: { color: colors.text, fontWeight: '600' },
    noteContainer: {
        alignItems: 'flex-start',
        minHeight: 100,
        paddingVertical: spacing.xs,
    },
    noteText: { minHeight: 90, textAlignVertical: 'top' },
    errorText: { marginTop: 6 },
    saveButton: { marginBottom: 18, marginTop: 22 },
})
