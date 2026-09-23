import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'phosphor-react-native'
import { Controller, useForm } from 'react-hook-form'
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
    useWindowDimensions,
} from 'react-native'

import { priorityPresentations } from '../../../constants/priorities'
import {
    weekDayLabels,
    weekDays,
    type WeekDay,
} from '../../../constants/weekDays'
import { colors } from '../../../styles/colors'
import { getResponsiveScale } from '../../../styles/responsive'
import { spacing } from '../../../styles/spacing'
import { typography } from '../../../styles/typography'
import { addHabitSchema, type AddHabitFormData } from '../addHabitSchema'

type AddHabitModalProps = {
    isVisible: boolean
    initialWeekDay: WeekDay
    onClose: () => void
    onCreateHabit: (data: AddHabitFormData) => Promise<void>
}

const getInitialValues = (initialWeekDay: WeekDay): AddHabitFormData => ({
    name: '',
    description: '',
    categoryName: '',
    frequencyType: 'daily',
    weekDays: [initialWeekDay],
    priority: 'medium',
    estimatedDurationMinutes: '',
    preferredTime: '',
    isFocusOfDay: false,
})

export const AddHabitModal = ({
    isVisible,
    initialWeekDay,
    onClose,
    onCreateHabit,
}: AddHabitModalProps) => {
    const { height, width } = useWindowDimensions()
    const scale = getResponsiveScale(width)
    const daySize = Math.min(
        42 * scale,
        (width - spacing.lg * scale * 2 - 6 * 7) / 7,
    )
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')
    const {
        control,
        formState: { errors },
        handleSubmit,
        reset,
        setValue,
        watch,
    } = useForm<AddHabitFormData>({
        defaultValues: getInitialValues(initialWeekDay),
        resolver: zodResolver(addHabitSchema),
    })
    const frequencyType = watch('frequencyType')
    const selectedWeekDays = watch('weekDays')
    const selectedPriority = watch('priority')
    const isFocusOfDay = watch('isFocusOfDay')

    const handleClose = () => {
        if (isSubmitting) return
        reset(getInitialValues(initialWeekDay))
        setSubmitError('')
        onClose()
    }

    const toggleWeekDay = (day: WeekDay) => {
        const nextDays = selectedWeekDays.includes(day)
            ? selectedWeekDays.filter(selectedDay => selectedDay !== day)
            : [...selectedWeekDays, day].sort((left, right) => left - right)
        setValue('weekDays', nextDays, { shouldValidate: true })
    }

    const handleCreate = async (data: AddHabitFormData) => {
        setIsSubmitting(true)
        setSubmitError('')
        try {
            await onCreateHabit(data)
            reset(getInitialValues(initialWeekDay))
            onClose()
        } catch {
            setSubmitError('Unable to save this habit. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }
    const handleFormSubmit = () => handleSubmit(handleCreate)()

    return (
        <Modal
            animationType="slide"
            onRequestClose={handleClose}
            statusBarTranslucent
            transparent
            visible={isVisible}
        >
            <View style={styles.overlay}>
                <Pressable
                    accessibilityLabel="Close add habit modal"
                    onPress={handleClose}
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
                                borderTopLeftRadius: 28 * scale,
                                borderTopRightRadius: 28 * scale,
                                maxHeight: height * 0.9,
                                paddingHorizontal: spacing.lg * scale,
                            },
                        ]}
                    >
                        <View style={styles.header}>
                            <Text
                                style={[styles.title, { fontSize: 34 * scale }]}
                            >
                                Add habit
                            </Text>
                            <Pressable
                                accessibilityLabel="Close add habit modal"
                                accessibilityRole="button"
                                disabled={isSubmitting}
                                onPress={handleClose}
                                style={styles.closeButton}
                            >
                                <X color={colors.text} size={30 * scale} />
                            </Pressable>
                        </View>

                        <ScrollView
                            contentContainerStyle={{
                                paddingBottom: 20 * scale,
                            }}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <Text style={styles.sectionTitle}>
                                Create new habit
                            </Text>

                            <Text style={styles.label}>Name</Text>
                            <Controller
                                control={control}
                                name="name"
                                render={({ field }) => (
                                    <TextInput
                                        accessibilityLabel="Habit name"
                                        autoCapitalize="sentences"
                                        onChangeText={field.onChange}
                                        onBlur={field.onBlur}
                                        placeholder="e.g. Study"
                                        placeholderTextColor={colors.textMuted}
                                        style={[
                                            styles.input,
                                            errors.name && styles.inputError,
                                        ]}
                                        value={field.value}
                                    />
                                )}
                            />
                            {errors.name ? (
                                <Text style={styles.errorText}>
                                    {errors.name.message}
                                </Text>
                            ) : null}

                            <Text style={styles.label}>Description</Text>
                            <Controller
                                control={control}
                                name="description"
                                render={({ field }) => (
                                    <TextInput
                                        accessibilityLabel="Habit description"
                                        multiline
                                        onChangeText={field.onChange}
                                        onBlur={field.onBlur}
                                        placeholder="What does this habit mean to you?"
                                        placeholderTextColor={colors.textMuted}
                                        style={[
                                            styles.input,
                                            styles.multilineInput,
                                        ]}
                                        textAlignVertical="top"
                                        value={field.value}
                                    />
                                )}
                            />

                            <Text style={styles.label}>Category</Text>
                            <Controller
                                control={control}
                                name="categoryName"
                                render={({ field }) => (
                                    <TextInput
                                        accessibilityLabel="Habit category"
                                        autoCapitalize="words"
                                        onChangeText={field.onChange}
                                        onBlur={field.onBlur}
                                        placeholder="e.g. Personal growth"
                                        placeholderTextColor={colors.textMuted}
                                        style={styles.input}
                                        value={field.value}
                                    />
                                )}
                            />

                            <Text style={styles.label}>Frequency</Text>
                            <Controller
                                control={control}
                                name="frequencyType"
                                render={({ field }) => (
                                    <View style={styles.optionRow}>
                                        {(
                                            [
                                                ['daily', 'Every day'],
                                                ['weekly', 'Selected days'],
                                            ] as const
                                        ).map(([value, label]) => {
                                            const isSelected =
                                                field.value === value
                                            return (
                                                <Pressable
                                                    accessibilityRole="radio"
                                                    accessibilityState={{
                                                        selected: isSelected,
                                                    }}
                                                    key={value}
                                                    onPress={() =>
                                                        field.onChange(value)
                                                    }
                                                    style={[
                                                        styles.option,
                                                        isSelected &&
                                                            styles.optionSelected,
                                                    ]}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.optionText,
                                                            isSelected &&
                                                                styles.optionTextSelected,
                                                        ]}
                                                    >
                                                        {label}
                                                    </Text>
                                                </Pressable>
                                            )
                                        })}
                                    </View>
                                )}
                            />
                            {frequencyType === 'weekly' ? (
                                <View style={styles.daysRow}>
                                    {weekDays.map(day => {
                                        const isSelected =
                                            selectedWeekDays.includes(day)
                                        return (
                                            <Pressable
                                                accessibilityLabel={
                                                    weekDayLabels[day]
                                                }
                                                accessibilityRole="checkbox"
                                                accessibilityState={{
                                                    checked: isSelected,
                                                }}
                                                key={day}
                                                onPress={() =>
                                                    toggleWeekDay(day)
                                                }
                                                style={[
                                                    styles.dayButton,
                                                    {
                                                        borderRadius:
                                                            daySize / 2,
                                                        height: daySize,
                                                        width: daySize,
                                                    },
                                                    isSelected &&
                                                        styles.dayButtonSelected,
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.dayText,
                                                        isSelected &&
                                                            styles.dayTextSelected,
                                                    ]}
                                                >
                                                    {weekDayLabels[day].slice(
                                                        0,
                                                        2,
                                                    )}
                                                </Text>
                                            </Pressable>
                                        )
                                    })}
                                </View>
                            ) : null}
                            {errors.weekDays ? (
                                <Text style={styles.errorText}>
                                    {errors.weekDays.message}
                                </Text>
                            ) : null}

                            <Text style={styles.label}>Priority</Text>
                            <Controller
                                control={control}
                                name="priority"
                                render={({ field }) => (
                                    <View style={styles.optionRow}>
                                        {(
                                            ['low', 'medium', 'high'] as const
                                        ).map(priority => {
                                            const isSelected =
                                                selectedPriority === priority
                                            return (
                                                <Pressable
                                                    accessibilityRole="radio"
                                                    accessibilityState={{
                                                        selected: isSelected,
                                                    }}
                                                    key={priority}
                                                    onPress={() =>
                                                        field.onChange(priority)
                                                    }
                                                    style={[
                                                        styles.priorityOption,
                                                        {
                                                            backgroundColor:
                                                                priorityPresentations[
                                                                    priority
                                                                ].color,
                                                        },
                                                        !isSelected &&
                                                            styles.priorityOptionUnselected,
                                                    ]}
                                                >
                                                    <Text
                                                        style={
                                                            styles.priorityText
                                                        }
                                                    >
                                                        {
                                                            priorityPresentations[
                                                                priority
                                                            ].label
                                                        }
                                                    </Text>
                                                </Pressable>
                                            )
                                        })}
                                    </View>
                                )}
                            />

                            <View style={styles.twoColumnRow}>
                                <View style={styles.column}>
                                    <Text style={styles.label}>Duration</Text>
                                    <Controller
                                        control={control}
                                        name="estimatedDurationMinutes"
                                        render={({ field }) => (
                                            <TextInput
                                                accessibilityLabel="Estimated duration in minutes"
                                                keyboardType="number-pad"
                                                onChangeText={field.onChange}
                                                onBlur={field.onBlur}
                                                placeholder="Minutes"
                                                placeholderTextColor={
                                                    colors.textMuted
                                                }
                                                style={styles.input}
                                                value={field.value}
                                            />
                                        )}
                                    />
                                    {errors.estimatedDurationMinutes ? (
                                        <Text style={styles.errorText}>
                                            {
                                                errors.estimatedDurationMinutes
                                                    .message
                                            }
                                        </Text>
                                    ) : null}
                                </View>
                                <View style={styles.column}>
                                    <Text style={styles.label}>
                                        Preferred time
                                    </Text>
                                    <Controller
                                        control={control}
                                        name="preferredTime"
                                        render={({ field }) => (
                                            <TextInput
                                                accessibilityLabel="Preferred habit time"
                                                keyboardType="numbers-and-punctuation"
                                                onChangeText={field.onChange}
                                                onBlur={field.onBlur}
                                                placeholder="HH:MM"
                                                placeholderTextColor={
                                                    colors.textMuted
                                                }
                                                style={styles.input}
                                                value={field.value}
                                            />
                                        )}
                                    />
                                    {errors.preferredTime ? (
                                        <Text style={styles.errorText}>
                                            {errors.preferredTime.message}
                                        </Text>
                                    ) : null}
                                </View>
                            </View>

                            <View style={styles.focusRow}>
                                <View style={styles.focusCopy}>
                                    <Text style={styles.focusTitle}>
                                        Focus of the day
                                    </Text>
                                    <Text style={styles.focusDescription}>
                                        Highlight this habit at the top of your
                                        day.
                                    </Text>
                                </View>
                                <Controller
                                    control={control}
                                    name="isFocusOfDay"
                                    render={({ field }) => (
                                        <Switch
                                            accessibilityLabel="Focus of the day"
                                            onValueChange={field.onChange}
                                            thumbColor={colors.text}
                                            trackColor={{
                                                false: colors.border,
                                                true: colors.accentStrong,
                                            }}
                                            value={isFocusOfDay}
                                        />
                                    )}
                                />
                            </View>

                            {submitError ? (
                                <Text style={styles.submitError}>
                                    {submitError}
                                </Text>
                            ) : null}
                            <Pressable
                                accessibilityLabel="Create habit"
                                accessibilityRole="button"
                                disabled={isSubmitting}
                                onPress={handleFormSubmit}
                                style={[
                                    styles.submitButton,
                                    isSubmitting && styles.submitButtonDisabled,
                                ]}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color={colors.text} />
                                ) : (
                                    <Text style={styles.submitText}>
                                        ADD HABIT
                                    </Text>
                                )}
                            </Pressable>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        backgroundColor: 'rgba(0, 0, 0, 0.46)',
        bottom: 0,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,
    },
    sheetWrapper: { flex: 1, justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: colors.background,
        borderTopColor: colors.border,
        borderTopWidth: 1,
        paddingTop: 20,
    },
    header: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 18,
    },
    title: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontWeight: '300',
    },
    closeButton: {
        alignItems: 'center',
        height: spacing.touchTarget,
        justifyContent: 'center',
        width: spacing.touchTarget,
    },
    sectionTitle: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 24,
        fontWeight: '400',
        marginBottom: 18,
    },
    label: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 18,
    },
    input: {
        backgroundColor: colors.surfaceInput,
        borderRadius: 8,
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 17,
        minHeight: 54,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    inputError: { borderColor: colors.danger, borderWidth: 1 },
    multilineInput: { minHeight: 92 },
    errorText: {
        color: colors.danger,
        fontFamily: typography.fontFamily,
        fontSize: 12,
        marginTop: 5,
    },
    optionRow: { flexDirection: 'row', gap: 8 },
    option: {
        alignItems: 'center',
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.border,
        borderRadius: 8,
        borderWidth: 1,
        flex: 1,
        justifyContent: 'center',
        minHeight: 48,
        paddingHorizontal: 8,
    },
    optionSelected: {
        backgroundColor: colors.accent,
        borderColor: colors.accentStrong,
    },
    optionText: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 14,
    },
    optionTextSelected: { color: colors.text },
    daysRow: { flexDirection: 'row', gap: 7, marginTop: 10 },
    dayButton: {
        alignItems: 'center',
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.border,
        borderRadius: 20,
        borderWidth: 1,
        height: 42,
        justifyContent: 'center',
        width: 42,
    },
    dayButtonSelected: {
        backgroundColor: colors.accentStrong,
        borderColor: colors.accentStrong,
    },
    dayText: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 12,
    },
    dayTextSelected: { color: colors.text },
    priorityOption: {
        alignItems: 'center',
        borderRadius: 8,
        flex: 1,
        justifyContent: 'center',
        minHeight: 46,
    },
    priorityOptionUnselected: { opacity: 0.42 },
    priorityText: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 14,
        fontWeight: '600',
    },
    twoColumnRow: { flexDirection: 'row', gap: 12 },
    column: { flex: 1 },
    focusRow: {
        alignItems: 'center',
        backgroundColor: colors.surfaceMuted,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 22,
        paddingHorizontal: 16,
        paddingVertical: 13,
    },
    focusCopy: { flex: 1, paddingRight: 12 },
    focusTitle: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 15,
        fontWeight: '600',
    },
    focusDescription: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 12,
        marginTop: 3,
    },
    submitError: {
        color: colors.danger,
        fontFamily: typography.fontFamily,
        marginTop: 14,
        textAlign: 'center',
    },
    submitButton: {
        alignItems: 'center',
        backgroundColor: colors.priorityLow,
        borderRadius: 8,
        justifyContent: 'center',
        marginTop: 22,
        minHeight: 56,
    },
    submitButtonDisabled: { opacity: 0.65 },
    submitText: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 19,
        fontWeight: '600',
    },
})
