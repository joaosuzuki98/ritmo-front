import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native'
import { X } from 'phosphor-react-native'

import {
    addTodoTaskSchema,
    type AddTodoTaskFormData,
} from '../addTodoTaskSchema'
import { colors } from '../../../styles/colors'
import { spacing } from '../../../styles/spacing'
import { typography } from '../../../styles/typography'

type AddTodoTaskModalProps = {
    category: string
    isVisible: boolean
    onClose: () => void
    onCreateTask: (title: string) => void
}

export const AddTodoTaskModal = ({
    category,
    isVisible,
    onClose,
    onCreateTask,
}: AddTodoTaskModalProps) => {
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
        if (isVisible) reset({ title: '' })
    }, [isVisible, reset])

    const handleCreate = ({ title }: AddTodoTaskFormData) => {
        onCreateTask(title.trim())
        reset({ title: '' })
        onClose()
    }
    const submitTask = () => handleSubmit(handleCreate)()

    return (
        <Modal
            animationType="slide"
            onRequestClose={onClose}
            transparent
            visible={isVisible}
        >
            <View style={styles.overlay}>
                <Pressable
                    accessibilityLabel="Fechar criação de tarefa"
                    onPress={onClose}
                    style={styles.backdrop}
                />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.sheetWrapper}
                >
                    <View style={styles.sheet}>
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.title}>Nova tarefa</Text>
                                <Text style={styles.subtitle}>{category}</Text>
                            </View>
                            <Pressable
                                accessibilityLabel="Fechar criação de tarefa"
                                accessibilityRole="button"
                                onPress={onClose}
                                style={styles.closeButton}
                            >
                                <X color={colors.text} size={25} />
                            </Pressable>
                        </View>
                        <Text style={styles.label}>
                            O que você precisa fazer?
                        </Text>
                        <Controller
                            control={control}
                            name="title"
                            render={({ field }) => (
                                <TextInput
                                    accessibilityLabel="Nome da tarefa"
                                    autoCapitalize="sentences"
                                    autoFocus
                                    onBlur={field.onBlur}
                                    onChangeText={field.onChange}
                                    onSubmitEditing={submitTask}
                                    placeholder="Ex.: Revisar anotações"
                                    placeholderTextColor={colors.textMuted}
                                    returnKeyType="done"
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
                        <Pressable
                            accessibilityRole="button"
                            onPress={submitTask}
                            style={styles.submitButton}
                        >
                            <Text style={styles.submitText}>
                                Adicionar tarefa
                            </Text>
                        </Pressable>
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
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        borderTopColor: colors.border,
        borderTopWidth: 1,
        padding: spacing.lg,
        paddingBottom: spacing.xl,
    },
    header: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    title: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 25,
        fontWeight: '600',
    },
    subtitle: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 14,
        marginTop: spacing.xxs,
    },
    closeButton: {
        alignItems: 'center',
        height: spacing.touchTarget,
        justifyContent: 'center',
        width: spacing.touchTarget,
    },
    label: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 15,
        fontWeight: '600',
        marginBottom: spacing.sm,
        marginTop: spacing.lg,
    },
    input: {
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.border,
        borderRadius: 12,
        borderWidth: 1,
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 16,
        minHeight: 54,
        paddingHorizontal: spacing.md,
    },
    inputError: { borderColor: colors.danger },
    errorText: {
        color: colors.danger,
        fontFamily: typography.fontFamily,
        fontSize: 12,
        marginTop: spacing.xs,
    },
    submitButton: {
        alignItems: 'center',
        backgroundColor: colors.accent,
        borderRadius: 12,
        justifyContent: 'center',
        marginTop: spacing.lg,
        minHeight: 54,
    },
    submitText: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 16,
        fontWeight: '600',
    },
})
