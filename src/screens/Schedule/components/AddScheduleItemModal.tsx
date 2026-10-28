import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native'

import {
    addScheduleItemSchema,
    type AddScheduleItemFormData,
} from '../addScheduleItemSchema'
import type { Event } from '../../../database'
import { BottomSheetLayout } from '../../../components/BottomSheetLayout'
import { colors } from '../../../styles/colors'
import { globalStyles } from '../../../styles/globalStyles'
import { spacing } from '../../../styles/spacing'
import { typography } from '../../../styles/typography'
import { FormActionButton } from '../../../components/FormActionButton'
import { FormTextInput } from '../../../components/FormTextInput'
import { getScheduleTimeParts } from '../scheduleTime'
import { ScheduleTimeInput } from './ScheduleTimeInput'

type AddScheduleItemModalProps = {
    initialStartHour: number
    isVisible: boolean
    item?: Event | null
    onClose: () => void
    onCreateItem: (data: AddScheduleItemFormData) => Promise<void>
    onDeleteItem?: () => Promise<void>
    onUpdateItem?: (data: AddScheduleItemFormData) => Promise<void>
    title?: string
    submitLabel?: string
    showEventDetails?: boolean
    showReminderType?: boolean
}

const reminderTypeOptions = [
    ['normal', 'Normal'],
    ['holiday', 'Holiday'],
    ['important_day', 'Important day'],
] as const

const getInitialValues = (
    startHour: number,
    item?: Event | null,
): AddScheduleItemFormData => {
    const initialStart = getScheduleTimeParts(
        item?.dateTime.getHours() ?? startHour,
    )
    const defaultEnd = new Date(item?.dateTime ?? new Date())
    if (!item || !item.endTime)
        defaultEnd.setHours(
            (item?.dateTime.getHours() ?? startHour) + 1,
            0,
            0,
            0,
        )
    const endDate = item?.endTime ?? defaultEnd
    const initialEnd = getScheduleTimeParts(endDate.getHours())

    return {
        endHour: initialEnd.hour,
        endPeriod: initialEnd.period,
        startHour: initialStart.hour,
        startPeriod: initialStart.period,
        title: item?.title ?? '',
        location: item?.location ?? '',
        description: item?.description ?? '',
        reminderType:
            item?.reminderType === 'holiday' ||
            item?.reminderType === 'important_day'
                ? item.reminderType
                : 'normal',
    }
}

export const AddScheduleItemModal = ({
    initialStartHour,
    isVisible,
    item = null,
    onClose,
    onCreateItem,
    onDeleteItem,
    onUpdateItem,
    title,
    submitLabel,
    showEventDetails = false,
    showReminderType = false,
}: AddScheduleItemModalProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')
    const {
        control,
        formState: { errors },
        handleSubmit,
        reset,
        setValue,
        watch,
    } = useForm<AddScheduleItemFormData>({
        defaultValues: getInitialValues(initialStartHour, item),
        resolver: zodResolver(addScheduleItemSchema),
    })

    useEffect(() => {
        if (isVisible) reset(getInitialValues(initialStartHour, item))
    }, [initialStartHour, isVisible, item, reset])

    const handleClose = () => {
        if (isSubmitting) return
        reset(getInitialValues(initialStartHour, item))
        setSubmitError('')
        onClose()
    }
    const selectedReminderType = watch('reminderType')
    const handleSave = async (data: AddScheduleItemFormData) => {
        setIsSubmitting(true)
        setSubmitError('')
        try {
            if (item) {
                if (!onUpdateItem)
                    throw new Error('Missing schedule item update handler.')
                await onUpdateItem(data)
            } else {
                await onCreateItem(data)
            }
            reset(getInitialValues(initialStartHour))
            onClose()
        } catch (error) {
            setSubmitError(
                error instanceof Error
                    ? error.message
                    : 'Unable to save this schedule item. Please retry.',
            )
        } finally {
            setIsSubmitting(false)
        }
    }
    const handleDelete = () => {
        if (!onDeleteItem) return
        Alert.alert('Delete schedule item?', 'This action cannot be undone.', [
            { style: 'cancel', text: 'Cancel' },
            {
                onPress: () => {
                    setIsSubmitting(true)
                    setSubmitError('')
                    onDeleteItem()
                        .then(() => {
                            reset(getInitialValues(initialStartHour))
                            onClose()
                        })
                        .catch(() =>
                            setSubmitError(
                                'Unable to delete this schedule item. Please retry.',
                            ),
                        )
                        .finally(() => setIsSubmitting(false))
                },
                style: 'destructive',
                text: 'Delete',
            },
        ])
    }

    return (
        <BottomSheetLayout
            closeAccessibilityLabel="Close schedule item modal"
            heightMode="fixed"
            isCloseDisabled={isSubmitting}
            isVisible={isVisible}
            onClose={handleClose}
            title={title ?? (item ? 'Edit schedule item' : 'Add schedule item')}
        >
            <ScrollView
                style={styles.formScroll}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View>
                    <Text style={[globalStyles.formFieldLabel, styles.label]}>
                        Item name
                    </Text>
                    <Controller
                        control={control}
                        name="title"
                        render={({ field }) => (
                            <FormTextInput
                                accessibilityLabel="Schedule item name"
                                autoCapitalize="sentences"
                                onBlur={field.onBlur}
                                onChangeText={field.onChange}
                                placeholder="e.g. Team meeting"
                                hasError={Boolean(errors.title)}
                                value={field.value}
                            />
                        )}
                    />
                    {errors.title ? (
                        <Text
                            style={[
                                globalStyles.formErrorText,
                                styles.errorText,
                            ]}
                        >
                            {errors.title.message}
                        </Text>
                    ) : null}
                    {showEventDetails ? (
                        <>
                            <Text
                                style={[
                                    globalStyles.formFieldLabel,
                                    styles.label,
                                ]}
                            >
                                Location
                            </Text>
                            <Controller
                                control={control}
                                name="location"
                                render={({ field }) => (
                                    <FormTextInput
                                        accessibilityLabel="Event location"
                                        autoCapitalize="words"
                                        onBlur={field.onBlur}
                                        onChangeText={field.onChange}
                                        placeholder="e.g. Main office"
                                        value={field.value ?? ''}
                                    />
                                )}
                            />
                            <Text
                                style={[
                                    globalStyles.formFieldLabel,
                                    styles.label,
                                ]}
                            >
                                Description
                            </Text>
                            <Controller
                                control={control}
                                name="description"
                                render={({ field }) => (
                                    <FormTextInput
                                        accessibilityLabel="Event description"
                                        autoCapitalize="sentences"
                                        containerStyle={
                                            styles.descriptionContainer
                                        }
                                        multiline
                                        onBlur={field.onBlur}
                                        onChangeText={field.onChange}
                                        placeholder="Add details"
                                        style={styles.descriptionInput}
                                        textAlignVertical="top"
                                        value={field.value ?? ''}
                                    />
                                )}
                            />
                        </>
                    ) : null}
                    {showReminderType ? (
                        <View>
                            <Text
                                style={[
                                    globalStyles.formFieldLabel,
                                    styles.label,
                                ]}
                            >
                                Reminder type
                            </Text>
                            <View style={styles.reminderTypes}>
                                {reminderTypeOptions.map(([value, label]) => {
                                    const isSelected =
                                        selectedReminderType === value
                                    return (
                                        <Pressable
                                            accessibilityRole="button"
                                            accessibilityState={{
                                                selected: isSelected,
                                            }}
                                            key={value}
                                            onPress={() =>
                                                setValue('reminderType', value)
                                            }
                                            style={[
                                                styles.reminderType,
                                                isSelected &&
                                                    styles.selectedReminderType,
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.reminderTypeText,
                                                    isSelected &&
                                                        styles.selectedReminderTypeText,
                                                ]}
                                            >
                                                {label}
                                            </Text>
                                        </Pressable>
                                    )
                                })}
                            </View>
                        </View>
                    ) : null}
                    <View style={styles.timeRow}>
                        <View style={styles.timeColumn}>
                            <Text
                                style={[
                                    globalStyles.formFieldLabel,
                                    styles.label,
                                ]}
                            >
                                Starts at
                            </Text>
                            <ScheduleTimeInput
                                accessibilityLabel="Schedule item start hour"
                                control={control}
                                hourName="startHour"
                                periodName="startPeriod"
                            />
                        </View>
                        <View style={styles.timeColumn}>
                            <Text
                                style={[
                                    globalStyles.formFieldLabel,
                                    styles.label,
                                ]}
                            >
                                Ends at
                            </Text>
                            <ScheduleTimeInput
                                accessibilityLabel="Schedule item end hour"
                                control={control}
                                hourName="endHour"
                                periodName="endPeriod"
                            />
                        </View>
                    </View>
                </View>
                <View style={styles.actions}>
                    {submitError ? (
                        <Text
                            style={[
                                globalStyles.formErrorText,
                                styles.errorText,
                            ]}
                        >
                            {submitError}
                        </Text>
                    ) : null}
                    {item && onDeleteItem ? (
                        <FormActionButton
                            accessibilityLabel="Delete schedule item"
                            disabled={isSubmitting}
                            onPress={handleDelete}
                            title="Delete item"
                            variant="destructive"
                        />
                    ) : null}
                    <FormActionButton
                        accessibilityLabel={
                            item
                                ? 'Save schedule item changes'
                                : 'Add schedule item'
                        }
                        disabled={isSubmitting}
                        isLoading={isSubmitting}
                        onPress={() => handleSubmit(handleSave)()}
                        title={
                            submitLabel ?? (item ? 'Save changes' : 'Add item')
                        }
                    />
                </View>
            </ScrollView>
        </BottomSheetLayout>
    )
}

const styles = StyleSheet.create({
    formScroll: { flex: 1 },
    content: {
        flexGrow: 1,
        justifyContent: 'space-between',
        paddingBottom: spacing.lg,
    },
    label: {
        marginTop: 20,
    },
    errorText: { marginTop: 5 },
    timeRow: { flexDirection: 'row', gap: spacing.md },
    timeColumn: { flex: 1 },
    descriptionContainer: {
        alignItems: 'flex-start',
        minHeight: 88,
        paddingVertical: spacing.xs,
    },
    descriptionInput: { minHeight: 78, textAlignVertical: 'top' },
    reminderTypes: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    reminderType: {
        borderColor: colors.border,
        borderRadius: 18,
        borderWidth: 1,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
    },
    selectedReminderType: {
        backgroundColor: colors.accent,
        borderColor: colors.accent,
    },
    reminderTypeText: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 14,
    },
    selectedReminderTypeText: { color: colors.text },
    actions: { gap: spacing.sm },
})
