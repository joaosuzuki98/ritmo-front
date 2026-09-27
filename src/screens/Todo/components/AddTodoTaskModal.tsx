import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
    Animated,
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
import { X } from 'phosphor-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
    addTodoTaskSchema,
    type AddTodoTaskFormData,
} from '../addTodoTaskSchema'
import { colors } from '../../../styles/colors'
import { spacing } from '../../../styles/spacing'
import { typography } from '../../../styles/typography'
import { getResponsiveScale } from '../../../styles/responsive'
import { useBottomSheetAnimation } from '../../../hooks/useBottomSheetAnimation'
import { FormActionButton } from '../../../components/FormActionButton'
import { FormTextInput } from '../../../components/FormTextInput'

type AddTodoTaskModalProps = {
    category: string
    isVisible: boolean
    onClose: () => void
    onCreateTask: (title: string) => Promise<void>
}

export const AddTodoTaskModal = ({
    category,
    isVisible,
    onClose,
    onCreateTask,
}: AddTodoTaskModalProps) => {
    const { height, width } = useWindowDimensions()
    const { bottom } = useSafeAreaInsets()
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
            setSubmitError('Não foi possível salvar a tarefa. Tente novamente.')
        } finally {
            setIsSubmitting(false)
        }
    }
    const submitTask = () => handleSubmit(handleCreate)()

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
                        accessibilityLabel="Fechar criação de tarefa"
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
                            <View style={styles.titleBlock}>
                                <Text
                                    style={[
                                        styles.title,
                                        { fontSize: 34 * scale },
                                    ]}
                                >
                                    Nova tarefa
                                </Text>
                                <Text
                                    style={[
                                        styles.subtitle,
                                        { fontSize: 14 * scale },
                                    ]}
                                >
                                    {category}
                                </Text>
                            </View>
                            <Pressable
                                accessibilityLabel="Fechar criação de tarefa"
                                accessibilityRole="button"
                                disabled={isSubmitting}
                                onPress={handleClose}
                                style={styles.closeButton}
                            >
                                <X color={colors.text} size={30 * scale} />
                            </Pressable>
                        </View>
                        <ScrollView
                            contentContainerStyle={styles.content}
                            keyboardShouldPersistTaps="handled"
                            style={styles.formScroll}
                        >
                            <View>
                                <Text
                                    style={[
                                        styles.label,
                                        { fontSize: 15 * scale },
                                    ]}
                                >
                                    O que você precisa fazer?
                                </Text>
                                <Controller
                                    control={control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormTextInput
                                            accessibilityLabel="Nome da tarefa"
                                            autoCapitalize="sentences"
                                            autoFocus
                                            onBlur={field.onBlur}
                                            onChangeText={field.onChange}
                                            onSubmitEditing={submitTask}
                                            placeholder="Ex.: Revisar anotações"
                                            returnKeyType="done"
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
                                {submitError ? (
                                    <Text style={styles.errorText}>
                                        {submitError}
                                    </Text>
                                ) : null}
                            </View>
                            <FormActionButton
                                accessibilityLabel="Adicionar tarefa"
                                disabled={isSubmitting}
                                isLoading={isSubmitting}
                                onPress={submitTask}
                                title="Adicionar tarefa"
                                containerStyle={styles.submitButton}
                            />
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
        marginBottom: spacing.md,
    },
    titleBlock: { flex: 1 },
    formScroll: { flex: 1 },
    content: {
        flexGrow: 1,
        justifyContent: 'space-between',
        paddingBottom: spacing.xl,
    },
    title: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontWeight: '300',
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
        fontWeight: '500',
        marginBottom: spacing.xxs,
        marginTop: spacing.lg,
    },
    errorText: {
        color: colors.danger,
        fontFamily: typography.fontFamily,
        fontSize: 12,
        marginTop: spacing.xs,
    },
    submitButton: { marginTop: spacing.lg },
})
