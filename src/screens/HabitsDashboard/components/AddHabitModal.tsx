import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import DateTimePicker, {
    DateTimePickerAndroid,
} from '@react-native-community/datetimepicker'
import { Picker } from '@react-native-picker/picker'
import { X } from 'phosphor-react-native'
import { Controller, useForm } from 'react-hook-form'
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated'
import {
    Pressable,
    ScrollView,
    Platform,
    StyleSheet,
    Text,
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
import { globalStyles } from '../../../styles/globalStyles'
import { getResponsiveScale } from '../../../styles/responsive'
import { spacing } from '../../../styles/spacing'
import { typography } from '../../../styles/typography'
import { FormActionButton } from '../../../components/FormActionButton'
import { FormTextInput } from '../../../components/FormTextInput'
import { addHabitSchema, type AddHabitFormData } from '../addHabitSchema'
import { formatPreferredTime, parsePreferredTime } from '../preferredTime'
import { habitRequirementStatuses } from '../../../constants/habitRequirementStatuses'
import type { HabitCardViewData, HabitOption } from '../habitDashboard.types'
import { BottomSheetLayout } from '../../../components/BottomSheetLayout'
import { theme } from '../../../styles/theme'

type AddHabitModalProps = {
    isVisible: boolean
    initialWeekDay: WeekDay
    habit?: HabitCardViewData | null
    habitOptions: readonly HabitOption[]
    categoryOptions: readonly string[]
    onClose: () => void
    onCreateHabit: (data: AddHabitFormData) => Promise<void>
    onUpdateHabit?: (habitId: string, data: AddHabitFormData) => Promise<void>
}

const getInitialValues = (
    initialWeekDay: WeekDay,
    habit?: HabitCardViewData | null,
): AddHabitFormData => ({
    name: habit?.title ?? '',
    description: habit?.description ?? '',
    categoryName: habit?.categoryLabel ?? '',
    frequencyType: habit?.frequencyType === 'weekly' ? 'weekly' : 'daily',
    weekDays: habit?.weekDays.length ? habit.weekDays : [initialWeekDay],
    priority:
        habit?.priority === 'low' || habit?.priority === 'high'
            ? habit.priority
            : 'medium',
    estimatedDurationMinutes: habit?.estimatedDurationMinutes
        ? String(habit.estimatedDurationMinutes)
        : '',
    preferredTime: formatPreferredTime(habit?.preferredTime),
    dependencyHabitId: habit?.dependencyHabitId ?? '',
    conditionHabitId: habit?.conditionHabitId ?? '',
    conditionStatus:
        (habit?.conditionStatus as AddHabitFormData['conditionStatus']) ?? '',
})

const durationOptions = [
    { label: 'Not set', value: '' },
    ...[10, 20, 30, 40, 50].map(value => ({
        label: `${value} min`,
        value: String(value),
    })),
    ...Array.from({ length: 12 }, (_, index) => {
        const hours = index + 1
        return { label: `${hours} hr`, value: String(hours * 60) }
    }),
]

const conditionStatusLabels = {
    completed: 'Completed',
    partial: 'Partially',
    skipped: 'Unfinished',
} as const

export const AddHabitModal = ({
    isVisible,
    initialWeekDay,
    habit = null,
    habitOptions,
    categoryOptions,
    onClose,
    onCreateHabit,
    onUpdateHabit,
}: AddHabitModalProps) => {
    const { width } = useWindowDimensions()
    const scale = getResponsiveScale(width)
    const daySize = Math.min(42 * scale, (width - spacing.lg * scale * 2) / 7)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')
    const [isPreferredTimePickerVisible, setIsPreferredTimePickerVisible] =
        useState(false)
    const [isEnteringNewCategory, setIsEnteringNewCategory] = useState(false)
    const {
        control,
        formState: { errors },
        handleSubmit,
        reset,
        setValue,
        watch,
    } = useForm<AddHabitFormData>({
        defaultValues: getInitialValues(initialWeekDay, habit),
        resolver: zodResolver(addHabitSchema),
    })
    const frequencyType = watch('frequencyType')
    const selectedWeekDays = watch('weekDays')
    const selectedPriority = watch('priority')
    const dependencyHabitId = watch('dependencyHabitId')
    const conditionHabitId = watch('conditionHabitId')
    const conditionStatus = watch('conditionStatus')
    const categoryName = watch('categoryName')
    const preferredTime = watch('preferredTime')
    const estimatedDurationMinutes = watch('estimatedDurationMinutes')

    useEffect(() => {
        if (isVisible) {
            reset(getInitialValues(initialWeekDay, habit))
            setIsPreferredTimePickerVisible(false)
            setIsEnteringNewCategory(false)
        }
    }, [habit, initialWeekDay, isVisible, reset])

    const handleClose = () => {
        if (isSubmitting) return
        reset(getInitialValues(initialWeekDay))
        setSubmitError('')
        setIsPreferredTimePickerVisible(false)
        setIsEnteringNewCategory(false)
        onClose()
    }

    const handlePreferredTimeChange = (date: Date) => {
        setValue('preferredTime', formatPreferredTime(date), {
            shouldValidate: true,
        })
    }

    const handleOpenPreferredTimePicker = () => {
        if (Platform.OS === 'android') {
            DateTimePickerAndroid.open({
                display: 'clock',
                is24Hour: false,
                minuteInterval: 5,
                mode: 'time',
                onValueChange: (_event, date) =>
                    handlePreferredTimeChange(date),
                value: parsePreferredTime(preferredTime) ?? new Date(),
            })
            return
        }

        setIsPreferredTimePickerVisible(visible => !visible)
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
            if (habit && onUpdateHabit) await onUpdateHabit(habit.id, data)
            else await onCreateHabit(data)
            reset(getInitialValues(initialWeekDay))
            onClose()
        } catch (error) {
            setSubmitError(
                error instanceof Error
                    ? error.message
                    : 'Unable to save this habit. Please try again.',
            )
        } finally {
            setIsSubmitting(false)
        }
    }
    const handleFormSubmit = () => handleSubmit(handleCreate)()

    return (
        <BottomSheetLayout
            closeAccessibilityLabel="Close add habit modal"
            headerStyle={{ marginBottom: theme.bottomSheet.headerGap }}
            isCloseDisabled={isSubmitting}
            isVisible={isVisible}
            onClose={handleClose}
            title={habit ? 'Edit habit' : 'Add habit'}
        >
            <ScrollView
                contentContainerStyle={{
                    paddingBottom: 20 * scale,
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Text style={[globalStyles.formFieldLabel, styles.label]}>
                    Name
                </Text>
                <Controller
                    control={control}
                    name="name"
                    render={({ field }) => (
                        <FormTextInput
                            accessibilityLabel="Habit name"
                            autoCapitalize="sentences"
                            onChangeText={field.onChange}
                            onBlur={field.onBlur}
                            placeholder="e.g. Study"
                            hasError={Boolean(errors.name)}
                            value={field.value}
                        />
                    )}
                />
                {errors.name ? (
                    <Text
                        style={[globalStyles.formErrorText, styles.errorText]}
                    >
                        {errors.name.message}
                    </Text>
                ) : null}

                <Text style={[globalStyles.formFieldLabel, styles.label]}>
                    Description
                </Text>
                <Controller
                    control={control}
                    name="description"
                    render={({ field }) => (
                        <FormTextInput
                            accessibilityLabel="Habit description"
                            multiline
                            onChangeText={field.onChange}
                            onBlur={field.onBlur}
                            placeholder="What does this habit mean to you?"
                            containerStyle={styles.multilineContainer}
                            style={styles.multilineText}
                            textAlignVertical="top"
                            value={field.value}
                        />
                    )}
                />

                <Text style={[globalStyles.formFieldLabel, styles.label]}>
                    Category
                </Text>
                {categoryOptions.length > 0 && !isEnteringNewCategory ? (
                    <View style={styles.settingsPickerContainer}>
                        <Picker
                            accessibilityLabel="Choose habit category"
                            dropdownIconColor={colors.textMuted}
                            dropdownIconRippleColor="transparent"
                            mode="dropdown"
                            onValueChange={itemValue => {
                                const value = String(itemValue)
                                if (value === '__create_new_category__') {
                                    setValue('categoryName', '')
                                    setIsEnteringNewCategory(true)
                                    return
                                }
                                setValue('categoryName', value)
                            }}
                            selectedValue={categoryName}
                            style={styles.settingsPicker}
                        >
                            <Picker.Item
                                label="Choose a category"
                                style={styles.settingsPickerItem}
                                value=""
                            />
                            {categoryOptions.map(option => (
                                <Picker.Item
                                    key={option}
                                    label={option}
                                    style={styles.settingsPickerItem}
                                    value={option}
                                />
                            ))}
                            <Picker.Item
                                label="Add a new category"
                                style={styles.addCategoryPickerItem}
                                value="__create_new_category__"
                            />
                        </Picker>
                    </View>
                ) : (
                    <Animated.View
                        entering={FadeInDown.duration(180)}
                        exiting={FadeOutUp.duration(140)}
                    >
                        <Controller
                            control={control}
                            name="categoryName"
                            render={({ field }) => (
                                <FormTextInput
                                    accessibilityLabel="Habit category"
                                    autoCapitalize="words"
                                    onChangeText={field.onChange}
                                    onBlur={field.onBlur}
                                    placeholder="e.g. Personal growth"
                                    value={field.value}
                                />
                            )}
                        />
                        {categoryOptions.length > 0 ? (
                            <Pressable
                                accessibilityRole="button"
                                onPress={() => setIsEnteringNewCategory(false)}
                                style={styles.backToCategories}
                            >
                                <Text style={styles.newCategoryText}>
                                    Choose an existing category
                                </Text>
                            </Pressable>
                        ) : null}
                    </Animated.View>
                )}

                <Text style={[globalStyles.formFieldLabel, styles.label]}>
                    Frequency
                </Text>
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
                                const isSelected = field.value === value
                                return (
                                    <Pressable
                                        accessibilityRole="radio"
                                        accessibilityState={{
                                            selected: isSelected,
                                        }}
                                        key={value}
                                        onPress={() => field.onChange(value)}
                                        style={[
                                            styles.option,
                                            isSelected && styles.optionSelected,
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
                    <Animated.View
                        entering={FadeInDown.duration(180)}
                        exiting={FadeOutUp.duration(140)}
                        style={styles.daysRow}
                    >
                        {weekDays.map(day => {
                            const isSelected = selectedWeekDays.includes(day)
                            return (
                                <Pressable
                                    accessibilityLabel={weekDayLabels[day]}
                                    accessibilityRole="checkbox"
                                    accessibilityState={{
                                        checked: isSelected,
                                    }}
                                    key={day}
                                    onPress={() => toggleWeekDay(day)}
                                    style={[
                                        styles.dayButton,
                                        {
                                            borderRadius: daySize / 2,
                                            height: daySize,
                                            width: daySize,
                                        },
                                        isSelected && styles.dayButtonSelected,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.dayText,
                                            isSelected &&
                                                styles.dayTextSelected,
                                        ]}
                                    >
                                        {weekDayLabels[day].slice(0, 2)}
                                    </Text>
                                </Pressable>
                            )
                        })}
                    </Animated.View>
                ) : null}
                {errors.weekDays ? (
                    <Text
                        style={[globalStyles.formErrorText, styles.errorText]}
                    >
                        {errors.weekDays.message}
                    </Text>
                ) : null}

                <Text style={[globalStyles.formFieldLabel, styles.label]}>
                    Complete after
                </Text>
                <View style={styles.settingsPickerContainer}>
                    <Picker
                        accessibilityLabel="Choose prerequisite habit"
                        dropdownIconColor={colors.textMuted}
                        dropdownIconRippleColor="transparent"
                        mode="dropdown"
                        onValueChange={itemValue =>
                            setValue('dependencyHabitId', String(itemValue), {
                                shouldValidate: true,
                            })
                        }
                        selectedValue={dependencyHabitId}
                        style={styles.settingsPicker}
                    >
                        <Picker.Item
                            label="No prerequisite"
                            style={styles.settingsPickerItem}
                            value=""
                        />
                        {habitOptions
                            .filter(option => option.id !== conditionHabitId)
                            .map(option => (
                                <Picker.Item
                                    key={option.id}
                                    label={option.title}
                                    style={styles.settingsPickerItem}
                                    value={option.id}
                                />
                            ))}
                    </Picker>
                </View>
                {habitOptions.length === 0 ? (
                    <Text style={styles.helperText}>
                        Create another habit first to add a prerequisite.
                    </Text>
                ) : null}

                <Text style={[globalStyles.formFieldLabel, styles.label]}>
                    Only when another habit is
                </Text>
                <View style={styles.settingsPickerContainer}>
                    <Picker
                        accessibilityLabel="Choose condition habit"
                        dropdownIconColor={colors.textMuted}
                        dropdownIconRippleColor="transparent"
                        mode="dropdown"
                        onValueChange={itemValue => {
                            const selectedHabitId = String(itemValue)
                            setValue('conditionHabitId', selectedHabitId, {
                                shouldValidate: true,
                            })
                            setValue(
                                'conditionStatus',
                                selectedHabitId
                                    ? conditionStatus || 'completed'
                                    : '',
                                { shouldValidate: true },
                            )
                        }}
                        selectedValue={conditionHabitId}
                        style={styles.settingsPicker}
                    >
                        <Picker.Item
                            label="No condition"
                            style={styles.settingsPickerItem}
                            value=""
                        />
                        {habitOptions
                            .filter(option => option.id !== dependencyHabitId)
                            .map(option => (
                                <Picker.Item
                                    key={option.id}
                                    label={option.title}
                                    style={styles.settingsPickerItem}
                                    value={option.id}
                                />
                            ))}
                    </Picker>
                </View>
                {conditionHabitId ? (
                    <Animated.View
                        entering={FadeInDown.duration(180)}
                        exiting={FadeOutUp.duration(140)}
                    >
                        <Text
                            style={[globalStyles.formFieldLabel, styles.label]}
                        >
                            Must be marked as
                        </Text>
                        <View style={styles.optionRow}>
                            {habitRequirementStatuses.map(status => {
                                const isSelected = conditionStatus === status
                                return (
                                    <Pressable
                                        accessibilityRole="radio"
                                        accessibilityState={{
                                            selected: isSelected,
                                        }}
                                        key={status}
                                        onPress={() =>
                                            setValue(
                                                'conditionStatus',
                                                status,
                                                {
                                                    shouldValidate: true,
                                                },
                                            )
                                        }
                                        style={[
                                            styles.option,
                                            isSelected && styles.optionSelected,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.optionText,
                                                isSelected &&
                                                    styles.optionTextSelected,
                                            ]}
                                        >
                                            {conditionStatusLabels[status]}
                                        </Text>
                                    </Pressable>
                                )
                            })}
                        </View>
                    </Animated.View>
                ) : null}
                {errors.conditionHabitId ? (
                    <Text
                        style={[globalStyles.formErrorText, styles.errorText]}
                    >
                        {errors.conditionHabitId.message}
                    </Text>
                ) : null}
                {errors.conditionStatus ? (
                    <Text
                        style={[globalStyles.formErrorText, styles.errorText]}
                    >
                        {errors.conditionStatus.message}
                    </Text>
                ) : null}

                <Text style={[globalStyles.formFieldLabel, styles.label]}>
                    Priority
                </Text>
                <Controller
                    control={control}
                    name="priority"
                    render={({ field }) => (
                        <View style={styles.optionRow}>
                            {(['low', 'medium', 'high'] as const).map(
                                priority => {
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
                                            <Text style={styles.priorityText}>
                                                {
                                                    priorityPresentations[
                                                        priority
                                                    ].label
                                                }
                                            </Text>
                                        </Pressable>
                                    )
                                },
                            )}
                        </View>
                    )}
                />

                <View style={styles.twoColumnRow}>
                    <View style={styles.column}>
                        <Text
                            style={[globalStyles.formFieldLabel, styles.label]}
                        >
                            Duration
                        </Text>
                        <View style={styles.settingsPickerContainer}>
                            <Picker
                                accessibilityLabel="Estimated duration"
                                dropdownIconColor={colors.textMuted}
                                dropdownIconRippleColor="transparent"
                                mode="dropdown"
                                onValueChange={itemValue =>
                                    setValue(
                                        'estimatedDurationMinutes',
                                        String(itemValue),
                                        { shouldValidate: true },
                                    )
                                }
                                selectedValue={estimatedDurationMinutes}
                                style={styles.settingsPicker}
                            >
                                {durationOptions.map(option => (
                                    <Picker.Item
                                        key={option.value || 'not-set'}
                                        label={option.label}
                                        style={styles.settingsPickerItem}
                                        value={option.value}
                                    />
                                ))}
                            </Picker>
                        </View>
                        {errors.estimatedDurationMinutes ? (
                            <Text
                                style={[
                                    globalStyles.formErrorText,
                                    styles.errorText,
                                ]}
                            >
                                {errors.estimatedDurationMinutes.message}
                            </Text>
                        ) : null}
                    </View>
                    <View style={styles.column}>
                        <Text
                            style={[globalStyles.formFieldLabel, styles.label]}
                        >
                            Preferred time
                        </Text>
                        <View>
                            <View style={styles.preferredTimeRow}>
                                <Pressable
                                    accessibilityLabel="Choose preferred time"
                                    accessibilityRole="button"
                                    onPress={handleOpenPreferredTimePicker}
                                    style={styles.preferredTimeButton}
                                >
                                    <Text
                                        numberOfLines={1}
                                        style={[
                                            styles.optionText,
                                            Boolean(preferredTime) &&
                                                styles.optionTextSelected,
                                        ]}
                                    >
                                        {preferredTime
                                            ? parsePreferredTime(
                                                  preferredTime,
                                              )?.toLocaleTimeString([], {
                                                  hour: 'numeric',
                                                  minute: '2-digit',
                                              })
                                            : 'Choose a time'}
                                    </Text>
                                </Pressable>
                                {preferredTime ? (
                                    <Pressable
                                        accessibilityLabel="Clear preferred time"
                                        accessibilityRole="button"
                                        onPress={() =>
                                            setValue('preferredTime', '', {
                                                shouldValidate: true,
                                            })
                                        }
                                        style={styles.clearTimeButton}
                                    >
                                        <X
                                            color={colors.dayCount}
                                            size={theme.spacing.md}
                                            weight="regular"
                                        />
                                    </Pressable>
                                ) : null}
                            </View>
                            {Platform.OS === 'ios' &&
                            isPreferredTimePickerVisible ? (
                                <DateTimePicker
                                    display="spinner"
                                    minuteInterval={5}
                                    mode="time"
                                    onValueChange={(_event, date) =>
                                        handlePreferredTimeChange(date)
                                    }
                                    value={
                                        parsePreferredTime(preferredTime) ??
                                        new Date()
                                    }
                                />
                            ) : null}
                        </View>
                        {errors.preferredTime ? (
                            <Text
                                style={[
                                    globalStyles.formErrorText,
                                    styles.errorText,
                                ]}
                            >
                                {errors.preferredTime.message}
                            </Text>
                        ) : null}
                    </View>
                </View>

                {submitError ? (
                    <Text style={styles.submitError}>{submitError}</Text>
                ) : null}
                <FormActionButton
                    accessibilityLabel={
                        habit ? 'Save habit changes' : 'Create habit'
                    }
                    disabled={isSubmitting}
                    isLoading={isSubmitting}
                    onPress={handleFormSubmit}
                    title={habit ? 'Save changes' : 'Add habit'}
                    containerStyle={styles.submitButton}
                />
            </ScrollView>
        </BottomSheetLayout>
    )
}

const styles = StyleSheet.create({
    label: {
        marginTop: 18,
    },
    multilineContainer: {
        alignItems: 'flex-start',
        minHeight: 92,
        paddingVertical: spacing.xs,
    },
    multilineText: { minHeight: 80, textAlignVertical: 'top' },
    errorText: { marginTop: 5 },
    optionRow: { flexDirection: 'row', gap: 8 },
    option: {
        alignItems: 'center',
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.border,
        borderRadius: 4,
        borderWidth: 1,
        flex: 1,
        justifyContent: 'center',
        minHeight: 40,
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
    settingsPickerContainer: {
        backgroundColor: colors.surfaceInput,
        borderRadius: 4,
        height: Platform.OS === 'android' ? 40 : undefined,
        minHeight: 40,
        justifyContent: 'center',
        overflow: 'hidden',
    },
    settingsPicker: {
        backgroundColor: colors.surfaceInput,
        color: colors.text,
        fontFamily: typography.fontFamily,
        // Keep the native item's vertical padding outside the compact field.
        flexShrink: 0,
    },
    settingsPickerItem: {
        backgroundColor: colors.surfaceInput,
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 14,
    },
    addCategoryPickerItem: {
        backgroundColor: colors.surfaceInput,
        color: colors.accent,
        fontFamily: typography.fontFamily,
        fontSize: 14,
    },
    newCategoryText: {
        color: colors.accent,
        fontFamily: typography.fontFamily,
        fontSize: 14,
    },
    backToCategories: { alignSelf: 'flex-start', marginTop: spacing.xs },
    daysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    helperText: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 13,
    },
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
        borderRadius: 4,
        flex: 1,
        justifyContent: 'center',
        minHeight: 40,
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
    preferredTimeRow: {
        alignItems: 'center',
        backgroundColor: colors.surfaceInput,
        borderRadius: 4,
        flexDirection: 'row',
    },
    preferredTimeButton: {
        flex: 1,
        justifyContent: 'center',
        minHeight: 40,
        paddingHorizontal: 10,
    },
    clearTimeButton: {
        alignItems: 'center',
        minHeight: 40,
        justifyContent: 'center',
        paddingHorizontal: spacing.sm,
    },
    submitError: {
        color: colors.danger,
        fontFamily: typography.fontFamily,
        marginTop: 14,
        textAlign: 'center',
    },
    submitButton: { marginTop: 22 },
})
