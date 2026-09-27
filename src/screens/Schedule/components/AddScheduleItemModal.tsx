import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'phosphor-react-native'
import { Controller, useForm } from 'react-hook-form'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
    Animated,
    Alert,
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

import {
    addScheduleItemSchema,
    type AddScheduleItemFormData,
} from '../addScheduleItemSchema'
import type { Event } from '../../../database'
import { useBottomSheetAnimation } from '../../../hooks/useBottomSheetAnimation'
import { colors } from '../../../styles/colors'
import { getResponsiveScale } from '../../../styles/responsive'
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
    subtitle?: string
    submitLabel?: string
}

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
    subtitle,
    submitLabel,
}: AddScheduleItemModalProps) => {
    const { bottom } = useSafeAreaInsets()
    const { height, width } = useWindowDimensions()
    const scale = getResponsiveScale(width)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')
    const { backdropOpacity, isModalMounted, sheetTranslateY } =
        useBottomSheetAnimation(isVisible, height)
    const {
        control,
        formState: { errors },
        handleSubmit,
        reset,
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
        <Modal
            animationType="none"
            onRequestClose={handleClose}
            statusBarTranslucent
            transparent
            visible={isModalMounted}
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[styles.backdrop, { opacity: backdropOpacity }]}
                >
                    <Pressable
                        accessibilityLabel="Close schedule item modal"
                        onPress={handleClose}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.sheetWrapper}
                >
                    <Animated.View
                        style={[
                            styles.sheet,
                            {
                                borderTopLeftRadius: 28 * scale,
                                borderTopRightRadius: 28 * scale,
                                height: height * 0.9,
                                paddingBottom: bottom,
                                paddingHorizontal: spacing.lg * scale,
                                transform: [{ translateY: sheetTranslateY }],
                            },
                        ]}
                    >
                        <View style={styles.header}>
                            <View>
                                <Text
                                    style={[
                                        styles.title,
                                        { fontSize: 34 * scale },
                                    ]}
                                >
                                    {title ??
                                        (item
                                            ? 'Edit schedule item'
                                            : 'Add schedule item')}
                                </Text>
                                <Text
                                    style={[
                                        styles.subtitle,
                                        { fontSize: 13 * scale },
                                    ]}
                                >
                                    {subtitle ??
                                        (item
                                            ? 'Update or remove this schedule item.'
                                            : 'Habits are added automatically.')}
                                </Text>
                            </View>
                            <Pressable
                                accessibilityLabel="Close schedule item modal"
                                accessibilityRole="button"
                                onPress={handleClose}
                                style={styles.closeButton}
                            >
                                <X color={colors.text} size={30 * scale} />
                            </Pressable>
                        </View>
                        <ScrollView
                            style={styles.formScroll}
                            contentContainerStyle={styles.content}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <View>
                                <Text style={styles.label}>Item name</Text>
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
                                    <Text style={styles.errorText}>
                                        {errors.title.message}
                                    </Text>
                                ) : null}
                                <View style={styles.timeRow}>
                                    <View style={styles.timeColumn}>
                                        <Text style={styles.label}>
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
                                        <Text style={styles.label}>
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
                                    <Text style={styles.errorText}>
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
                                        submitLabel ??
                                        (item ? 'Save changes' : 'Add item')
                                    }
                                />
                            </View>
                        </ScrollView>
                    </Animated.View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
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
    },
    title: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontWeight: '300',
    },
    subtitle: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        marginTop: 3,
    },
    closeButton: {
        alignItems: 'center',
        height: spacing.touchTarget,
        justifyContent: 'center',
        width: spacing.touchTarget,
    },
    formScroll: { flex: 1 },
    content: {
        flexGrow: 1,
        justifyContent: 'space-between',
        paddingBottom: spacing.lg,
    },
    label: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 15,
        fontWeight: '500',
        marginBottom: spacing.xxs,
        marginTop: 20,
    },
    errorText: {
        color: colors.danger,
        fontFamily: typography.fontFamily,
        fontSize: 12,
        marginTop: 5,
    },
    timeRow: { flexDirection: 'row', gap: spacing.md },
    timeColumn: { flex: 1 },
    actions: { gap: spacing.sm },
})
