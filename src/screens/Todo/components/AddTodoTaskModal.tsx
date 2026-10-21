import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

import {
    addTodoTaskSchema,
    type AddTodoTaskFormData,
} from '../addTodoTaskSchema'
import { spacing } from '../../../styles/spacing'
import { globalStyles } from '../../../styles/globalStyles'
import { BottomSheetLayout } from '../../../components/BottomSheetLayout'
import { FormActionButton } from '../../../components/FormActionButton'
import { FormTextInput } from '../../../components/FormTextInput'

type AddTodoTaskModalProps = {
    isVisible: boolean
    onClose: () => void
    onCreateTask: (title: string) => Promise<void>
}

export const AddTodoTaskModal = ({
    isVisible,
    onClose,
    onCreateTask,
}: AddTodoTaskModalProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')
    const {
        control,
        formState: { errors },
        handleSubmit,
        reset,
    } = useForm<AddTodoTaskFormData>({
        defaultValues: { title: '' },
        resolver: zodResolver(addTodoTaskSchema),
    })

    useEffect(() => {
        if (isVisible) {
            reset({ title: '' })
            setSubmitError('')
        }
    }, [isVisible, reset])

    const handleClose = () => {
        if (isSubmitting) return
        onClose()
    }

    const handleCreate = async ({ title }: AddTodoTaskFormData) => {
        if (isSubmitting) return
        setIsSubmitting(true)
        setSubmitError('')
        try {
            await onCreateTask(title.trim())
            reset({ title: '' })
            onClose()
        } catch {
            setSubmitError('Unable to save the task. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }
    const submitTask = () => handleSubmit(handleCreate)()

    return (
        <BottomSheetLayout
            closeAccessibilityLabel="Close task modal"
            heightMode="fixed"
            isCloseDisabled={isSubmitting}
            isVisible={isVisible}
            onClose={handleClose}
            title="Add task"
        >
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                style={styles.formScroll}
                showsVerticalScrollIndicator={false}
            >
                <View>
                    <Text style={[globalStyles.formFieldLabel, styles.label]}>
                        What do you need to do?
                    </Text>
                    <Controller
                        control={control}
                        name="title"
                        render={({ field }) => (
                            <FormTextInput
                                accessibilityLabel="Task name"
                                autoCapitalize="sentences"
                                autoFocus
                                onBlur={field.onBlur}
                                onChangeText={field.onChange}
                                onSubmitEditing={submitTask}
                                placeholder="e.g. Review notes"
                                returnKeyType="done"
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
                </View>
                <FormActionButton
                    accessibilityLabel="Add task"
                    disabled={isSubmitting}
                    isLoading={isSubmitting}
                    onPress={submitTask}
                    title="ADD TASK"
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
        marginTop: spacing.lg,
    },
    errorText: { marginTop: spacing.xs },
    submitButton: { marginTop: spacing.lg },
})
