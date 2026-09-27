import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'

import { FormActionButton } from '../../../components/FormActionButton'
import { FormTextInput } from '../../../components/FormTextInput'
import { colors } from '../../../styles/colors'
import { spacing } from '../../../styles/spacing'
import { typography } from '../../../styles/typography'
import {
    addTodoCategorySchema,
    type AddTodoCategoryFormData,
} from '../addTodoCategorySchema'

type AddTodoCategoryModalProps = {
    isVisible: boolean
    onClose: () => void
    onCreateCategory: (name: string) => Promise<void>
}

export const AddTodoCategoryModal = ({
    isVisible,
    onClose,
    onCreateCategory,
}: AddTodoCategoryModalProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')
    const {
        control,
        formState: { errors },
        handleSubmit,
        reset,
    } = useForm<AddTodoCategoryFormData>({
        defaultValues: { name: '' },
        resolver: zodResolver(addTodoCategorySchema),
    })

    useEffect(() => {
        if (!isVisible) return
        reset({ name: '' })
        setSubmitError('')
    }, [isVisible, reset])

    const handleCreate = async ({ name }: AddTodoCategoryFormData) => {
        if (isSubmitting) return
        setIsSubmitting(true)
        setSubmitError('')
        try {
            await onCreateCategory(name)
            reset({ name: '' })
            onClose()
        } catch (error) {
            setSubmitError(
                error instanceof Error
                    ? error.message
                    : 'Unable to save category. Please try again.',
            )
        } finally {
            setIsSubmitting(false)
        }
    }
    const submitCategory = () => handleSubmit(handleCreate)()

    return (
        <Modal
            animationType="fade"
            onRequestClose={onClose}
            transparent
            visible={isVisible}
        >
            <View style={styles.overlay}>
                <Pressable
                    accessibilityLabel="Close category form"
                    onPress={onClose}
                    style={styles.backdrop}
                />
                <View style={styles.card}>
                    <Text style={styles.title}>New category</Text>
                    <Controller
                        control={control}
                        name="name"
                        render={({ field }) => (
                            <FormTextInput
                                accessibilityLabel="Category name"
                                autoCapitalize="words"
                                onBlur={field.onBlur}
                                onChangeText={field.onChange}
                                onSubmitEditing={submitCategory}
                                placeholder="Ex.: Personal"
                                returnKeyType="done"
                                hasError={Boolean(errors.name)}
                                value={field.value}
                            />
                        )}
                    />
                    {errors.name ? (
                        <Text style={styles.errorText}>
                            {errors.name.message}
                        </Text>
                    ) : null}
                    {submitError ? (
                        <Text style={styles.errorText}>{submitError}</Text>
                    ) : null}
                    <View style={styles.actions}>
                        <Pressable
                            accessibilityRole="button"
                            disabled={isSubmitting}
                            onPress={onClose}
                            style={styles.cancelButton}
                        >
                            <Text style={styles.cancelText}>Cancel</Text>
                        </Pressable>
                        <FormActionButton
                            accessibilityLabel="Create category"
                            disabled={isSubmitting}
                            isLoading={isSubmitting}
                            onPress={submitCategory}
                            title="Create"
                        />
                    </View>
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
        padding: spacing.lg,
    },
    backdrop: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(0, 0, 0, 0.62)',
    },
    card: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: 20,
        borderWidth: 1,
        gap: spacing.sm,
        padding: spacing.lg,
        width: '100%',
    },
    title: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 20,
        fontWeight: '600',
    },
    errorText: {
        color: colors.danger,
        fontFamily: typography.fontFamily,
        fontSize: 12,
    },
    actions: {
        alignItems: 'center',
        flexDirection: 'column-reverse',
        gap: spacing.sm,
        justifyContent: 'flex-end',
        marginTop: spacing.sm,
    },
    cancelButton: {
        alignItems: 'center',
        minHeight: spacing.touchTarget,
        justifyContent: 'center',
        paddingHorizontal: spacing.md,
    },
    cancelText: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 14,
    },
})
