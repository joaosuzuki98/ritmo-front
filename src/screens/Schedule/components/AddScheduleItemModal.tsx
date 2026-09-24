import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'phosphor-react-native'
import { Controller, useForm } from 'react-hook-form'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    useWindowDimensions,
} from 'react-native'

import {
    addScheduleItemSchema,
    type AddScheduleItemFormData,
} from '../addScheduleItemSchema'
import { colors } from '../../../styles/colors'
import { getResponsiveScale } from '../../../styles/responsive'
import { spacing } from '../../../styles/spacing'
import { typography } from '../../../styles/typography'

type AddScheduleItemModalProps = {
    initialStartHour: number
    isVisible: boolean
    onClose: () => void
    onCreateItem: (data: AddScheduleItemFormData) => void
    title?: string
    subtitle?: string
    submitLabel?: string
}

const getInitialValues = (startHour: number): AddScheduleItemFormData => ({
    endTime: `${String(Math.min(23, startHour + 1)).padStart(2, '0')}:00`,
    startTime: `${String(startHour).padStart(2, '0')}:00`,
    title: '',
})

export const AddScheduleItemModal = ({
    initialStartHour,
    isVisible,
    onClose,
    onCreateItem,
    title = 'Add schedule item',
    subtitle = 'Habits are added automatically.',
    submitLabel = 'ADD ITEM',
}: AddScheduleItemModalProps) => {
    const { bottom } = useSafeAreaInsets()
    const { height, width } = useWindowDimensions()
    const scale = getResponsiveScale(width)
    const {
        control,
        formState: { errors },
        handleSubmit,
        reset,
    } = useForm<AddScheduleItemFormData>({
        defaultValues: getInitialValues(initialStartHour),
        resolver: zodResolver(addScheduleItemSchema),
    })

    useEffect(() => {
        if (isVisible) reset(getInitialValues(initialStartHour))
    }, [initialStartHour, isVisible, reset])

    const handleClose = () => {
        reset(getInitialValues(initialStartHour))
        onClose()
    }
    const handleCreate = (data: AddScheduleItemFormData) => {
        onCreateItem(data)
        reset(getInitialValues(initialStartHour))
        onClose()
    }

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
                    accessibilityLabel="Close add schedule item modal"
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
                                maxHeight: height * 0.78,
                                paddingBottom: bottom,
                                paddingHorizontal: spacing.lg * scale,
                            },
                        ]}
                    >
                        <View style={styles.header}>
                            <View>
                                <Text
                                    style={[
                                        styles.title,
                                        { fontSize: 30 * scale },
                                    ]}
                                >
                                    {title}
                                </Text>
                                <Text
                                    style={[
                                        styles.subtitle,
                                        { fontSize: 13 * scale },
                                    ]}
                                >
                                    {subtitle}
                                </Text>
                            </View>
                            <Pressable
                                accessibilityLabel="Close add schedule item modal"
                                accessibilityRole="button"
                                onPress={handleClose}
                                style={styles.closeButton}
                            >
                                <X color={colors.text} size={26 * scale} />
                            </Pressable>
                        </View>
                        <ScrollView
                            contentContainerStyle={styles.content}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <Text style={styles.label}>Item name</Text>
                            <Controller
                                control={control}
                                name="title"
                                render={({ field }) => (
                                    <TextInput
                                        accessibilityLabel="Schedule item name"
                                        autoCapitalize="sentences"
                                        onBlur={field.onBlur}
                                        onChangeText={field.onChange}
                                        placeholder="e.g. Team meeting"
                                        placeholderTextColor={colors.textMuted}
                                        style={[
                                            styles.input,
                                            errors.title && styles.inputError,
                                        ]}
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
                                    <Text style={styles.label}>Starts at</Text>
                                    <Controller
                                        control={control}
                                        name="startTime"
                                        render={({ field }) => (
                                            <TextInput
                                                accessibilityLabel="Schedule item start time"
                                                keyboardType="numbers-and-punctuation"
                                                maxLength={5}
                                                onBlur={field.onBlur}
                                                onChangeText={field.onChange}
                                                placeholder="08:00"
                                                placeholderTextColor={
                                                    colors.textMuted
                                                }
                                                style={[
                                                    styles.input,
                                                    errors.startTime &&
                                                        styles.inputError,
                                                ]}
                                                value={field.value}
                                            />
                                        )}
                                    />
                                    {errors.startTime ? (
                                        <Text style={styles.errorText}>
                                            {errors.startTime.message}
                                        </Text>
                                    ) : null}
                                </View>
                                <View style={styles.timeColumn}>
                                    <Text style={styles.label}>Ends at</Text>
                                    <Controller
                                        control={control}
                                        name="endTime"
                                        render={({ field }) => (
                                            <TextInput
                                                accessibilityLabel="Schedule item end time"
                                                keyboardType="numbers-and-punctuation"
                                                maxLength={5}
                                                onBlur={field.onBlur}
                                                onChangeText={field.onChange}
                                                placeholder="09:00"
                                                placeholderTextColor={
                                                    colors.textMuted
                                                }
                                                style={[
                                                    styles.input,
                                                    errors.endTime &&
                                                        styles.inputError,
                                                ]}
                                                value={field.value}
                                            />
                                        )}
                                    />
                                    {errors.endTime ? (
                                        <Text style={styles.errorText}>
                                            {errors.endTime.message}
                                        </Text>
                                    ) : null}
                                </View>
                            </View>
                            <Pressable
                                accessibilityLabel="Add schedule item"
                                accessibilityRole="button"
                                onPress={() => handleSubmit(handleCreate)()}
                                style={styles.submitButton}
                            >
                                <Text style={styles.submitText}>
                                    {submitLabel}
                                </Text>
                            </Pressable>
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
        backgroundColor: 'rgba(0, 0, 0, 0.62)',
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
        paddingTop: 22,
    },
    header: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    title: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontWeight: '400',
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
    content: { paddingBottom: spacing.lg },
    label: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 20,
    },
    input: {
        backgroundColor: colors.surfaceInput,
        borderRadius: 8,
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 16,
        minHeight: 54,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    inputError: { borderColor: colors.danger, borderWidth: 1 },
    errorText: {
        color: colors.danger,
        fontFamily: typography.fontFamily,
        fontSize: 12,
        marginTop: 5,
    },
    timeRow: { flexDirection: 'row', gap: spacing.md },
    timeColumn: { flex: 1 },
    submitButton: {
        alignItems: 'center',
        backgroundColor: colors.accent,
        borderRadius: 8,
        justifyContent: 'center',
        marginTop: spacing.lg,
        minHeight: 56,
    },
    submitText: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 18,
        fontWeight: '600',
    },
})
