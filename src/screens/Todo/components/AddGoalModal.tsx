import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native'

import { BottomSheetLayout } from '../../../components/BottomSheetLayout'
import { theme } from '../../../styles/theme'
import { FormActionButton } from '../../../components/FormActionButton'
import { FormTextInput } from '../../../components/FormTextInput'
import { colors } from '../../../styles/colors'
import { globalStyles } from '../../../styles/globalStyles'
import { getResponsiveScale } from '../../../styles/responsive'
import { spacing } from '../../../styles/spacing'
import { typography } from '../../../styles/typography'
import { addGoalSchema, type AddGoalFormData } from '../addGoalSchema'
import { goalTermOptions } from '../goalUtils'
import type { TodoGoalHabitOption } from '../todoGoals.types'

type AddGoalModalProps = {
    isVisible: boolean
    habitOptions: readonly TodoGoalHabitOption[]
    onClose: () => void
    onCreateGoal: (data: AddGoalFormData) => Promise<void>
}

export const AddGoalModal = ({
    isVisible,
    habitOptions,
    onClose,
    onCreateGoal,
}: AddGoalModalProps) => {
    const { width } = useWindowDimensions()
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
    } = useForm<AddGoalFormData>({
        defaultValues: {
            goalType: 'habit',
            habitId: habitOptions[0]?.id ?? '',
            includedHabitIds: [],
            term: 'short',
            description: '',
            targetValue: '10',
            targetPercentage: '80',
        },
        resolver: zodResolver(addGoalSchema),
    })
    const goalType = watch('goalType')
    const term = watch('term')
    const selectedHabitId = watch('habitId')
    const includedHabitIds = watch('includedHabitIds')

    useEffect(() => {
        if (!isVisible) return
        reset({
            goalType: 'habit',
            habitId: habitOptions[0]?.id ?? '',
            includedHabitIds: [],
            term: 'short',
            description: '',
            targetValue: '10',
            targetPercentage: '80',
        })
        setSubmitError('')
    }, [habitOptions, isVisible, reset])

    const handleClose = () => {
        if (isSubmitting) return
        onClose()
    }

    const toggleIncludedHabit = (habitId: string) => {
        const nextIds = includedHabitIds.includes(habitId)
            ? includedHabitIds.filter(id => id !== habitId)
            : [...includedHabitIds, habitId]
        setValue('includedHabitIds', nextIds, { shouldValidate: true })
    }

    const handleCreate = async (data: AddGoalFormData) => {
        setIsSubmitting(true)
        setSubmitError('')
        try {
            await onCreateGoal(data)
            onClose()
        } catch {
            setSubmitError('Unable to save this goal. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }
    const submitGoal = () => handleSubmit(handleCreate)()

    return (
        <BottomSheetLayout
            closeAccessibilityLabel="Close goal form"
            closeIconSize={theme.bottomSheet.compactCloseIconSize}
            headerStyle={{ marginBottom: theme.spacing.sm }}
            isCloseDisabled={isSubmitting}
            isVisible={isVisible}
            onClose={handleClose}
            sheetStyle={{ paddingTop: theme.spacing.md }}
            title="Set a goal"
            titleStyle={{
                fontSize: theme.bottomSheet.compactTitle.fontSize * scale,
            }}
        >
            <ScrollView
                contentContainerStyle={styles.formContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Text style={[globalStyles.formFieldLabel, styles.label]}>
                    Goal type
                </Text>
                <View style={styles.optionRow}>
                    {(
                        [
                            ['habit', 'One habit'],
                            ['group', 'Habit group'],
                        ] as const
                    ).map(([value, label]) => {
                        const isSelected = goalType === value
                        return (
                            <Pressable
                                accessibilityRole="radio"
                                accessibilityState={{
                                    selected: isSelected,
                                }}
                                key={value}
                                onPress={() =>
                                    setValue('goalType', value, {
                                        shouldValidate: true,
                                    })
                                }
                                style={[
                                    styles.option,
                                    isSelected && styles.optionSelected,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.optionText,
                                        isSelected && styles.optionTextSelected,
                                    ]}
                                >
                                    {label}
                                </Text>
                            </Pressable>
                        )
                    })}
                </View>

                <Text style={[globalStyles.formFieldLabel, styles.label]}>
                    {goalType === 'habit'
                        ? 'Choose a habit'
                        : 'Choose at least two habits'}
                </Text>
                <View style={styles.habitOptions}>
                    {habitOptions.map(habit => {
                        const isSelected =
                            goalType === 'habit'
                                ? selectedHabitId === habit.id
                                : includedHabitIds.includes(habit.id)
                        return (
                            <Pressable
                                accessibilityRole={
                                    goalType === 'habit' ? 'radio' : 'checkbox'
                                }
                                accessibilityState={
                                    goalType === 'habit'
                                        ? { selected: isSelected }
                                        : { checked: isSelected }
                                }
                                key={habit.id}
                                onPress={() =>
                                    goalType === 'habit'
                                        ? setValue('habitId', habit.id, {
                                              shouldValidate: true,
                                          })
                                        : toggleIncludedHabit(habit.id)
                                }
                                style={[
                                    styles.habitOption,
                                    isSelected && styles.habitOptionSelected,
                                ]}
                            >
                                <Text
                                    numberOfLines={2}
                                    style={[
                                        styles.optionText,
                                        isSelected && styles.optionTextSelected,
                                    ]}
                                >
                                    {habit.title}
                                </Text>
                            </Pressable>
                        )
                    })}
                </View>
                {goalType === 'habit' && errors.habitId ? (
                    <Text
                        style={[globalStyles.formErrorText, styles.errorText]}
                    >
                        {errors.habitId.message}
                    </Text>
                ) : null}
                {goalType === 'group' && errors.includedHabitIds ? (
                    <Text
                        style={[globalStyles.formErrorText, styles.errorText]}
                    >
                        {errors.includedHabitIds.message}
                    </Text>
                ) : null}
                {habitOptions.length === 0 ? (
                    <Text style={styles.helperText}>
                        Create a habit before setting a goal.
                    </Text>
                ) : null}

                <Text style={[globalStyles.formFieldLabel, styles.label]}>
                    Time frame
                </Text>
                <View style={styles.termOptions}>
                    {goalTermOptions.map(option => {
                        const isSelected = term === option.value
                        return (
                            <Pressable
                                accessibilityRole="radio"
                                accessibilityState={{
                                    selected: isSelected,
                                }}
                                key={option.value}
                                onPress={() =>
                                    setValue('term', option.value, {
                                        shouldValidate: true,
                                    })
                                }
                                style={[
                                    styles.termOption,
                                    isSelected && styles.optionSelected,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.optionText,
                                        isSelected && styles.optionTextSelected,
                                    ]}
                                >
                                    {option.label}
                                </Text>
                            </Pressable>
                        )
                    })}
                </View>

                <Text style={[globalStyles.formFieldLabel, styles.label]}>
                    Goal description
                </Text>
                <Controller
                    control={control}
                    name="description"
                    render={({ field }) => (
                        <FormTextInput
                            accessibilityLabel="Goal description"
                            autoCapitalize="sentences"
                            onBlur={field.onBlur}
                            onChangeText={field.onChange}
                            placeholder="e.g. Build a consistent reading habit"
                            hasError={Boolean(errors.description)}
                            value={field.value}
                        />
                    )}
                />
                {errors.description ? (
                    <Text
                        style={[globalStyles.formErrorText, styles.errorText]}
                    >
                        {errors.description.message}
                    </Text>
                ) : null}

                <Text style={[globalStyles.formFieldLabel, styles.label]}>
                    {goalType === 'habit'
                        ? 'Completed sessions to reach'
                        : 'Consistency target (%)'}
                </Text>
                <Controller
                    control={control}
                    name={
                        goalType === 'habit'
                            ? 'targetValue'
                            : 'targetPercentage'
                    }
                    render={({ field }) => (
                        <FormTextInput
                            accessibilityLabel={
                                goalType === 'habit'
                                    ? 'Target completed sessions'
                                    : 'Target consistency percentage'
                            }
                            keyboardType="number-pad"
                            onBlur={field.onBlur}
                            onChangeText={field.onChange}
                            placeholder={goalType === 'habit' ? '10' : '80'}
                            hasError={Boolean(
                                goalType === 'habit'
                                    ? errors.targetValue
                                    : errors.targetPercentage,
                            )}
                            value={field.value}
                        />
                    )}
                />
                {goalType === 'habit' && errors.targetValue ? (
                    <Text
                        style={[globalStyles.formErrorText, styles.errorText]}
                    >
                        {errors.targetValue.message}
                    </Text>
                ) : null}
                {goalType === 'group' && errors.targetPercentage ? (
                    <Text
                        style={[globalStyles.formErrorText, styles.errorText]}
                    >
                        {errors.targetPercentage.message}
                    </Text>
                ) : null}

                {submitError ? (
                    <Text
                        style={[globalStyles.formErrorText, styles.errorText]}
                    >
                        {submitError}
                    </Text>
                ) : null}
                <FormActionButton
                    accessibilityLabel="Save goal"
                    disabled={isSubmitting || habitOptions.length === 0}
                    isLoading={isSubmitting}
                    onPress={submitGoal}
                    title="Save goal"
                    containerStyle={styles.submitButton}
                />
            </ScrollView>
        </BottomSheetLayout>
    )
}

const styles = StyleSheet.create({
    formContent: { paddingBottom: spacing.xl },
    label: {
        marginTop: spacing.md,
    },
    optionRow: { flexDirection: 'row', gap: spacing.sm },
    option: {
        alignItems: 'center',
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.border,
        borderRadius: 10,
        borderWidth: 1,
        flex: 1,
        justifyContent: 'center',
        minHeight: 48,
        paddingHorizontal: spacing.sm,
    },
    optionSelected: {
        backgroundColor: colors.accent,
        borderColor: colors.accentStrong,
    },
    optionText: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 13,
    },
    optionTextSelected: { color: colors.text },
    habitOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    habitOption: {
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.border,
        borderRadius: 9,
        borderWidth: 1,
        justifyContent: 'center',
        minHeight: 42,
        paddingHorizontal: spacing.sm,
        width: '48%',
    },
    habitOptionSelected: {
        backgroundColor: colors.accent,
        borderColor: colors.accentStrong,
    },
    termOptions: { gap: spacing.sm },
    termOption: {
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.border,
        borderRadius: 9,
        borderWidth: 1,
        justifyContent: 'center',
        minHeight: 42,
        marginBottom: spacing.xxs,
        paddingHorizontal: spacing.md,
    },
    errorText: { marginTop: spacing.xs },
    submitButton: { marginTop: spacing.xl },
    helperText: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 12,
        marginTop: spacing.xs,
    },
})
