import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { StyleSheet, Text, View } from 'react-native'

import { AuthScreenLayout } from '../../components/AuthScreenLayout/AuthScreenLayout'
import { AuthTextInput } from '../../components/AuthTextInput/AuthTextInput'
import { FormActionButton } from '../../components/FormActionButton'
import {
    completePasswordReset,
    requestPasswordReset,
} from '../../services/auth'
import { colors } from '../../styles/colors'
import { spacing } from '../../styles/spacing'
import { typography } from '../../styles/typography'
import {
    forgotPasswordSchema,
    type ForgotPasswordFormData,
} from './forgotPasswordSchema'
import {
    resetPasswordSchema,
    type ResetPasswordFormData,
} from './resetPasswordSchema'
import { useTranslation } from '../../localization/useTranslation'

type ForgotPasswordScreenProps = {
    onBack: () => void
}

type ResetStep = 'email' | 'code' | 'done'

export const ForgotPasswordScreen = ({ onBack }: ForgotPasswordScreenProps) => {
    const { t } = useTranslation()
    const [step, setStep] = useState<ResetStep>('email')
    const [email, setEmail] = useState('')
    const [submitError, setSubmitError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const emailForm = useForm<ForgotPasswordFormData>({
        defaultValues: { email: '' },
        resolver: zodResolver(forgotPasswordSchema),
    })
    const resetForm = useForm<ResetPasswordFormData>({
        defaultValues: { code: '', password: '', confirmPassword: '' },
        resolver: zodResolver(resetPasswordSchema),
    })

    const handleRequestCode = async (data: ForgotPasswordFormData) => {
        if (isSubmitting) return
        setIsSubmitting(true)
        setSubmitError('')
        try {
            await requestPasswordReset(data.email)
            setEmail(data.email.trim().toLowerCase())
            setStep('code')
        } catch (error) {
            setSubmitError(
                error instanceof Error
                    ? error.message
                    : 'Could not request the code. Please try again.',
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCompleteReset = async (data: ResetPasswordFormData) => {
        if (isSubmitting) return
        setIsSubmitting(true)
        setSubmitError('')
        try {
            await completePasswordReset({
                email,
                code: data.code,
                password: data.password,
            })
            setStep('done')
        } catch (error) {
            setSubmitError(
                error instanceof Error
                    ? error.message
                    : 'Could not reset the password. Please try again.',
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    const description =
        step === 'email'
            ? t('We’ll send a code to the email on your account.')
            : step === 'code'
            ? t('Enter the code sent to {{email}} and choose a new password.', {
                  email,
              })
            : t('Your password has been updated. Sign in again to continue.')

    return (
        <AuthScreenLayout
            description={description}
            title={t('Recover password')}
        >
            <View>
                {step === 'email' ? (
                    <Controller
                        control={emailForm.control}
                        name="email"
                        render={({ field }) => (
                            <AuthTextInput
                                autoComplete="email"
                                error={
                                    emailForm.formState.errors.email?.message
                                }
                                keyboardType="email-address"
                                label={t('Email')}
                                onBlur={field.onBlur}
                                onChangeText={field.onChange}
                                placeholder={t('you@example.com')}
                                returnKeyType="done"
                                textContentType="emailAddress"
                                value={field.value}
                            />
                        )}
                    />
                ) : null}

                {step === 'code' ? (
                    <>
                        <Controller
                            control={resetForm.control}
                            name="code"
                            render={({ field }) => (
                                <AuthTextInput
                                    error={
                                        resetForm.formState.errors.code?.message
                                    }
                                    keyboardType="number-pad"
                                    label={t('8-digit code')}
                                    onBlur={field.onBlur}
                                    onChangeText={field.onChange}
                                    placeholder="12345678"
                                    returnKeyType="next"
                                    value={field.value}
                                />
                            )}
                        />
                        <Controller
                            control={resetForm.control}
                            name="password"
                            render={({ field }) => (
                                <AuthTextInput
                                    autoComplete="new-password"
                                    error={
                                        resetForm.formState.errors.password
                                            ?.message
                                    }
                                    label={t('New password')}
                                    onBlur={field.onBlur}
                                    onChangeText={field.onChange}
                                    placeholder={t('At least 8 characters')}
                                    secureTextEntry
                                    textContentType="newPassword"
                                    value={field.value}
                                />
                            )}
                        />
                        <Controller
                            control={resetForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <AuthTextInput
                                    autoComplete="new-password"
                                    error={
                                        resetForm.formState.errors
                                            .confirmPassword?.message
                                    }
                                    label={t('Confirm the new password')}
                                    onBlur={field.onBlur}
                                    onChangeText={field.onChange}
                                    placeholder={t('Enter your password again')}
                                    secureTextEntry
                                    textContentType="newPassword"
                                    value={field.value}
                                />
                            )}
                        />
                    </>
                ) : null}

                {submitError ? (
                    <Text accessibilityLiveRegion="polite" style={styles.error}>
                        {t(submitError)}
                    </Text>
                ) : null}

                {step === 'email' ? (
                    <FormActionButton
                        disabled={isSubmitting}
                        isLoading={isSubmitting}
                        onPress={emailForm.handleSubmit(handleRequestCode)}
                        title={t('Send code')}
                    />
                ) : null}
                {step === 'code' ? (
                    <FormActionButton
                        disabled={isSubmitting}
                        isLoading={isSubmitting}
                        onPress={resetForm.handleSubmit(handleCompleteReset)}
                        title={t('Reset password')}
                    />
                ) : null}
                {step === 'done' ? (
                    <FormActionButton
                        onPress={onBack}
                        title={t('Back to sign in')}
                    />
                ) : null}
                {step !== 'done' ? (
                    <FormActionButton
                        containerStyle={styles.secondaryButton}
                        disabled={isSubmitting}
                        onPress={onBack}
                        title={t('Back to sign in')}
                    />
                ) : null}
            </View>
        </AuthScreenLayout>
    )
}

const styles = StyleSheet.create({
    secondaryButton: { marginTop: spacing.md },
    error: {
        color: colors.danger,
        fontFamily: typography.fontFamily,
        fontSize: 13,
        marginBottom: spacing.md,
    },
})
