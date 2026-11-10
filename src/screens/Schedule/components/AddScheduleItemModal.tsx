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
import { getScheduleMinuteParts, getScheduleTimeParts } from '../scheduleTime'
import { ScheduleTimeInput } from './ScheduleTimeInput'
import { useTranslation } from '../../../localization/useTranslation'

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
            item?.dateTime.getMinutes() ?? 0,
            0,
            0,
        )
    const endDate = item?.endTime ?? defaultEnd
    const initialEnd = getScheduleTimeParts(endDate.getHours())

    return {
        endHour: initialEnd.hour,
        endMinute: getScheduleMinuteParts(endDate.getMinutes()),
        endPeriod: initialEnd.period,
        startHour: initialStart.hour,
        startMinute: getScheduleMinuteParts(item?.dateTime.getMinutes() ?? 0),
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
    const { t } = useTranslation()
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
        Alert.alert(
            t('Delete schedule item?'),
            t('This action cannot be undone.'),
            [
                { style: 'cancel', text: t('Cancel') },
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
                    text: t('Delete'),
                },
            ],
        )
    }

    return (
        <BottomSheetLayout
            closeAccessibilityLabel={t('Close schedule item modal')}
            heightMode="fixed"
            isCloseDisabled={isSubmitting}
            isVisible={isVisible}
            onClose={handleClose}
            title={
                title ?? t(item ? 'Edit schedule item' : 'Add schedule item')
            }
        >
            <ScrollView
                style={styles.formScroll}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View>
                    <Text style={[globalStyles.formFieldLabel, styles.label]}>
                        {t('Item name')}
                    </Text>
                    <Controller
                        control={control}
                        name="title"
                        render={({ field }) => (
                            <FormTextInput
                                accessibilityLabel={t('Schedule item name')}
                                autoCapitalize="sentences"
                                onBlur={field.onBlur}
                                onChangeText={field.onChange}
                                placeholder={t('e.g. Team meeting')}
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
                            {t(errors.title.message ?? '')}
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
                                {t('Location')}
                            </Text>
                            <Controller
                                control={control}
                                name="location"
                                render={({ field }) => (
                                    <FormTextInput
                                        accessibilityLabel={t('Event location')}
                                        autoCapitalize="words"
                                        onBlur={field.onBlur}
                                        onChangeText={field.onChange}
                                        placeholder={t('e.g. Main office')}
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
                                {t('Description')}
                            </Text>
                            <Controller
                                control={control}
                                name="description"
                                render={({ field }) => (
                                    <FormTextInput
                                        accessibilityLabel={t(
                                            'Event description',
                                        )}
                                        autoCapitalize="sentences"
                                        containerStyle={
                                            styles.descriptionContainer
                                        }
                                        multiline
                                        onBlur={field.onBlur}
                                        onChangeText={field.onChange}
                                        placeholder={t('Add details')}
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
                                {t('Reminder type')}
                            </Text>
                            <View style={styles.reminderTypes}>
                                {reminderTypeOptions.map(([value, label]) => {
                                    const isSelected =
                                        selectedReminderType === value
                                    return (
                                        <Pressable
                                            accessibilityRole="radio"
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
                                                numberOfLines={1}
                                                style={[
                                                    styles.reminderTypeText,
                                                    isSelected &&
                                                        styles.selectedReminderTypeText,
                                                ]}
                                            >
                                                {t(label)}
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
                                {t('Starts at')}
                            </Text>
                            <ScheduleTimeInput
                                accessibilityLabel={t(
                                    'Schedule item start hour',
                                )}
                                control={control}
                                hourName="startHour"
                                minuteName="startMinute"
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
                                {t('Ends at')}
                            </Text>
                            <ScheduleTimeInput
                                accessibilityLabel={t('Schedule item end hour')}
                                control={control}
                                hourName="endHour"
                                minuteName="endMinute"
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
                            {t(submitError)}
                        </Text>
                    ) : null}
                    {item && onDeleteItem ? (
                        <FormActionButton
                            accessibilityLabel={t('Delete schedule item')}
                            disabled={isSubmitting}
                            onPress={handleDelete}
                            title={t('Delete item')}
                            variant="destructive"
                        />
                    ) : null}
                    <FormActionButton
                        accessibilityLabel={
                            item
                                ? t('Save schedule item changes')
                                : t('Add schedule item')
                        }
                        disabled={isSubmitting}
                        isLoading={isSubmitting}
                        onPress={() => handleSubmit(handleSave)()}
                        title={
                            submitLabel ?? t(item ? 'Save changes' : 'Add item')
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
        marginTop: spacing.md,
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
    reminderTypes: { flexDirection: 'row', gap: spacing.sm },
    reminderType: {
        alignItems: 'center',
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.border,
        borderRadius: 4,
        borderWidth: 1,
        flex: 1,
        justifyContent: 'center',
        minHeight: 40,
        paddingHorizontal: spacing.xs,
    },
    selectedReminderType: {
        backgroundColor: colors.accent,
        borderColor: colors.accentStrong,
    },
    reminderTypeText: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 14,
    },
    selectedReminderTypeText: { color: colors.text },
    actions: { gap: spacing.sm },
})
