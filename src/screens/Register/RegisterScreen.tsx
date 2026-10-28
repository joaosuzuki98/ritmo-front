import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { StyleSheet, Text, View } from 'react-native'

import { AuthScreenLayout } from '../../components/AuthScreenLayout/AuthScreenLayout'
import { AuthTextInput } from '../../components/AuthTextInput/AuthTextInput'
import { FormActionButton } from '../../components/FormActionButton'
import type { User } from '../../database'
import { registerLocalUser } from '../../database/localAuth'
import type { OnboardingIdentity } from '../../types/onboarding'
import { colors } from '../../styles/colors'
import { spacing } from '../../styles/spacing'
import { typography } from '../../styles/typography'
import { registerSchema, type RegisterFormData } from './registerSchema'
import { PasswordRequirementItem } from './components/PasswordRequirementItem'

type RegisterScreenProps = {
    identity: OnboardingIdentity
    onBack: () => void
    onRegisterSuccess: (user: User) => void
}

export const RegisterScreen = ({
    identity,
    onBack,
    onRegisterSuccess,
}: RegisterScreenProps) => {
    const [submitError, setSubmitError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const {
        control,
        formState: { errors },
        handleSubmit,
        watch,
    } = useForm<RegisterFormData>({
        defaultValues: {
            email: '',
            password: '',
        },
        resolver: zodResolver(registerSchema),
    })
    const password = watch('password')
    const passwordRequirements = [
        { label: 'At least 8 characters', isMet: password.length >= 8 },
        { label: 'At least one number', isMet: /\d/.test(password) },
        {
            label: 'At least one special character',
            isMet: /[^a-zA-Z0-9]/.test(password),
        },
    ]

    const handleRegister = async (data: RegisterFormData) => {
        if (isSubmitting) return
        setIsSubmitting(true)
        setSubmitError('')
        try {
            const user = await registerLocalUser({ ...data, ...identity })
            onRegisterSuccess(user)
        } catch (error) {
            setSubmitError(
                error instanceof Error
                    ? error.message
                    : 'Unable to create your account. Please try again.',
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <AuthScreenLayout
            description="Start building a routine that works for you."
            footer={
                <Text style={styles.footerText}>
                    Already have an account?{' '}
                    <Text
                        accessibilityRole="link"
                        onPress={onBack}
                        style={styles.footerLink}
                    >
                        Sign in
                    </Text>
                </Text>
            }
            title="Create your account"
        >
            <View>
                <Controller
                    control={control}
                    name="email"
                    render={({ field }) => (
                        <AuthTextInput
                            autoComplete="email"
                            error={errors.email?.message}
                            keyboardType="email-address"
                            label="Email"
                            onBlur={field.onBlur}
                            onChangeText={field.onChange}
                            placeholder="you@example.com"
                            returnKeyType="done"
                            textContentType="emailAddress"
                            value={field.value}
                        />
                    )}
                />
                <Controller
                    control={control}
                    name="password"
                    render={({ field }) => (
                        <AuthTextInput
                            autoComplete="new-password"
                            error={errors.password?.message}
                            fieldStyle={styles.passwordField}
                            label="Password"
                            onBlur={field.onBlur}
                            onChangeText={field.onChange}
                            placeholder="At least 8 characters"
                            secureTextEntry
                            textContentType="newPassword"
                            value={field.value}
                        />
                    )}
                />
                <View
                    accessibilityLabel="Password requirements"
                    style={styles.passwordRequirements}
                >
                    {passwordRequirements.map(requirement => (
                        <PasswordRequirementItem
                            isMet={requirement.isMet}
                            key={requirement.label}
                            label={requirement.label}
                        />
                    ))}
                </View>
                {submitError ? (
                    <Text accessibilityLiveRegion="polite" style={styles.error}>
                        {submitError}
                    </Text>
                ) : null}
                <FormActionButton
                    disabled={isSubmitting}
                    onPress={handleSubmit(handleRegister)}
                    title={
                        isSubmitting ? 'Creating account…' : 'Create account'
                    }
                />
            </View>
        </AuthScreenLayout>
    )
}

const styles = StyleSheet.create({
    footerText: {
        color: colors.onboardingMuted,
        fontFamily: typography.fontFamily,
        fontSize: 13,
        lineHeight: 20,
        textAlign: 'center',
    },
    footerLink: { color: colors.white, fontWeight: '700' },
    passwordField: { marginBottom: spacing.md },
    passwordRequirements: {
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    error: {
        color: colors.danger,
        fontFamily: typography.fontFamily,
        fontSize: 13,
        marginBottom: 16,
    },
})
