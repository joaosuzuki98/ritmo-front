import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
    incompletionReasonOptions,
    type IncompletionReasonCode,
} from '../../../constants/incompletionReasons'
import { localDateKey } from '../../../utils/normalizeLocalDate'
import { FormActionButton } from '../../../components/FormActionButton'
import { FormTextInput } from '../../../components/FormTextInput'
import { colors } from '../../../styles/colors'
import { getResponsiveScale } from '../../../styles/responsive'
import { spacing } from '../../../styles/spacing'
import { typography } from '../../../styles/typography'
import type { HabitCardViewData } from '../habitDashboard.types'
import {
    logHabitProgressSchema,
    type LogHabitProgressFormData,
} from '../logHabitProgressSchema'

type LogHabitProgressModalProps = {
    habit: HabitCardViewData | null
    isVisible: boolean
    onClose: () => void
    onSave: (habitId: string, data: LogHabitProgressFormData) => Promise<void>
}

const getInitialValues = (
    habit: HabitCardViewData | null,
): LogHabitProgressFormData => {
    const todayKey = localDateKey(new Date())
    const record = habit?.completionHistory.find(
        item => localDateKey(item.date) === todayKey,
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
    onClose,
    onSave,
}: LogHabitProgressModalProps) => {
    const { height, width } = useWindowDimensions()
    const { bottom } = useSafeAreaInsets()
    const scale = getResponsiveScale(width)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')
    const {
        control,
        formState: { errors },
        handleSubmit,
        reset,
        setValue,
        watch,
    } = useForm<LogHabitProgressFormData>({
        defaultValues: getInitialValues(habit),
        resolver: zodResolver(logHabitProgressSchema),
    })
    const selectedStatus = watch('status')
    const selectedReason = watch('reason')

    useEffect(() => {
        if (isVisible) {
            reset(getInitialValues(habit))
            setSubmitError('')
        }
    }, [habit, isVisible, reset])

    const handleSave = async (data: LogHabitProgressFormData) => {
        if (!habit) return
        setIsSubmitting(true)
        setSubmitError('')
        try {
            await onSave(habit.id, data)
            onClose()
        } catch {
            setSubmitError('Unable to save progress. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }
    const handleFormSubmit = () => handleSubmit(handleSave)()

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
                    accessibilityLabel="Close progress form"
                    onPress={onClose}
                    style={styles.backdrop}
                />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.sheetWrapper}
                >
                    <View
                        style={[
                            styles.sheet,
                            {
                                maxHeight: height * 0.88,
                                paddingBottom: bottom,
                                paddingHorizontal: spacing.lg * scale,
                            },
                        ]}
                    >
                        <Text style={[styles.title, { fontSize: 28 * scale }]}>
                            Record today’s progress
                        </Text>
                        <Text style={styles.habitTitle}>{habit?.title}</Text>
                        <ScrollView
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <Text style={styles.label}>How did it go?</Text>
                            <View style={styles.statusOptions}>
                                {statusOptions.map(option => {
                                    const isSelected =
                                        selectedStatus === option.value
                                    return (
                                        <Pressable
                                            accessibilityRole="radio"
                                            accessibilityState={{
                                                selected: isSelected,
                                            }}
                                            key={option.value}
                                            onPress={() =>
                                                setValue(
                                                    'status',
                                                    option.value,
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
                                                {option.label}
                                            </Text>
                                        </Pressable>
                                    )
                                })}
                            </View>

                            {selectedStatus !== 'completed' ? (
                                <>
                                    <Text style={styles.label}>
                                        What got in the way?
                                    </Text>
                                    <View style={styles.statusOptions}>
                                        {incompletionReasonOptions.map(
                                            option => {
                                                const isSelected =
                                                    selectedReason ===
                                                    option.value
                                                return (
                                                    <Pressable
                                                        accessibilityRole="radio"
                                                        accessibilityState={{
                                                            selected:
                                                                isSelected,
                                                        }}
                                                        key={option.value}
                                                        onPress={() =>
                                                            setValue(
                                                                'reason',
                                                                option.value as IncompletionReasonCode,
                                                                {
                                                                    shouldValidate:
                                                                        true,
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
                                                            {option.label}
                                                        </Text>
                                                    </Pressable>
                                                )
                                            },
                                        )}
                                    </View>
                                    {errors.reason ? (
                                        <Text style={styles.errorText}>
                                            {errors.reason.message}
                                        </Text>
                                    ) : null}
                                </>
                            ) : null}

                            <Text style={styles.label}>Time</Text>
                            <Controller
                                control={control}
                                name="time"
                                render={({ field }) => (
                                    <FormTextInput
                                        accessibilityLabel="Progress time"
                                        keyboardType="numbers-and-punctuation"
                                        onBlur={field.onBlur}
                                        onChangeText={field.onChange}
                                        placeholder="HH:MM"
                                        hasError={Boolean(errors.time)}
                                        value={field.value}
                                    />
                                )}
                            />
                            {errors.time ? (
                                <Text style={styles.errorText}>
                                    {errors.time.message}
                                </Text>
                            ) : null}

                            <Text style={styles.label}>Observation</Text>
                            <Controller
                                control={control}
                                name="note"
                                render={({ field }) => (
                                    <FormTextInput
                                        accessibilityLabel="Progress observation"
                                        multiline
                                        onBlur={field.onBlur}
                                        onChangeText={field.onChange}
                                        placeholder="Add a note about today"
                                        containerStyle={styles.noteContainer}
                                        hasError={Boolean(errors.note)}
                                        style={styles.noteText}
                                        textAlignVertical="top"
                                        value={field.value}
                                    />
                                )}
                            />
                            {errors.note ? (
                                <Text style={styles.errorText}>
                                    {errors.note.message}
                                </Text>
                            ) : null}

                            {submitError ? (
                                <Text style={styles.errorText}>
                                    {submitError}
                                </Text>
                            ) : null}
                            <FormActionButton
                                accessibilityLabel="Save progress"
                                disabled={isSubmitting}
                                isLoading={isSubmitting}
                                onPress={handleFormSubmit}
                                title="Save progress"
                                containerStyle={styles.saveButton}
                            />
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: {
        backgroundColor: 'rgba(0, 0, 0, 0.52)',
        bottom: 0,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,
    },
    sheetWrapper: { flex: 1, justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: colors.background,
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
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 15,
        fontWeight: '500',
        marginBottom: spacing.xxs,
        marginTop: 20,
    },
    statusOptions: { gap: 8 },
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
    errorText: {
        color: colors.danger,
        fontFamily: typography.fontFamily,
        fontSize: 12,
        marginTop: 6,
    },
    saveButton: { marginBottom: 18, marginTop: 22 },
})
