import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

import { BottomSheetLayout } from '../../../components/BottomSheetLayout'
import { FormActionButton } from '../../../components/FormActionButton'
import { FormTextInput } from '../../../components/FormTextInput'
import { globalStyles } from '../../../styles/globalStyles'
import { spacing } from '../../../styles/spacing'
import {
    addTodoCategorySchema,
    type AddTodoCategoryFormData,
} from '../addTodoCategorySchema'
import { useTranslation } from '../../../localization/useTranslation'

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
    const { t } = useTranslation()
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
    const handleClose = () => {
        if (isSubmitting) return
        onClose()
    }

    return (
        <BottomSheetLayout
            closeAccessibilityLabel={t('Close category form')}
            heightMode="fixed"
            isCloseDisabled={isSubmitting}
            isVisible={isVisible}
            onClose={handleClose}
            title={t('New category')}
        >
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                style={styles.formScroll}
                showsVerticalScrollIndicator={false}
            >
                <View>
                    <Text style={[globalStyles.formFieldLabel, styles.label]}>
                        {t('Category name')}
                    </Text>
                    <Controller
                        control={control}
                        name="name"
                        render={({ field }) => (
                            <FormTextInput
                                accessibilityLabel={t('Category name')}
                                autoCapitalize="words"
                                onBlur={field.onBlur}
                                onChangeText={field.onChange}
                                onSubmitEditing={submitCategory}
                                placeholder={t('Ex.: Personal')}
                                returnKeyType="done"
                                hasError={Boolean(errors.name)}
                                value={field.value}
                            />
                        )}
                    />
                    {errors.name ? (
                        <Text
                            style={[
                                globalStyles.formErrorText,
                                styles.errorText,
                            ]}
                        >
                            {t(errors.name.message ?? '')}
                        </Text>
                    ) : null}
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
                </View>
                <FormActionButton
                    accessibilityLabel={t('Create category')}
                    disabled={isSubmitting}
                    isLoading={isSubmitting}
                    onPress={submitCategory}
                    title={t('Create category')}
                    containerStyle={styles.submitButton}
                />
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
    errorText: {
        marginTop: spacing.xs,
    },
    submitButton: {
        marginTop: spacing.lg,
    },
})
