import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Eye, EyeSlash } from 'phosphor-react-native'

import { AuthScreenLayout } from '../../components/AuthScreenLayout/AuthScreenLayout'
import { AuthTextInput } from '../../components/AuthTextInput/AuthTextInput'
import { FormActionButton } from '../../components/FormActionButton'
import type { User } from '../../database'
import { authenticateLocalUser } from '../../database/localAuth'
import { colors } from '../../styles/colors'
import { spacing } from '../../styles/spacing'
import { typography } from '../../styles/typography'
import { loginSchema, type LoginFormData } from './loginSchema'

type LoginScreenProps = {
    onForgotPasswordPress: () => void
    onLoginSuccess: (user: User) => void
    onRegisterPress: () => void
}

export const LoginScreen = ({
    onForgotPasswordPress,
    onLoginSuccess,
    onRegisterPress,
}: LoginScreenProps) => {
    const [submitError, setSubmitError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isPasswordVisible, setIsPasswordVisible] = useState(false)
    const {
        control,
        formState: { errors },
        handleSubmit,
    } = useForm<LoginFormData>({
        defaultValues: { email: '', password: '' },
        resolver: zodResolver(loginSchema),
    })

    const handleLogin = async ({ email, password }: LoginFormData) => {
        if (isSubmitting) return
        setIsSubmitting(true)
        setSubmitError('')
        try {
            const user = await authenticateLocalUser(email, password)
            onLoginSuccess(user)
        } catch (error) {
            setSubmitError(
                error instanceof Error
                    ? error.message
                    : 'Unable to sign in. Please try again.',
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <AuthScreenLayout
            description="Sign in to keep building a routine that works for you."
            footer={
                <Text style={styles.footerText}>
                    Don’t have an account?{' '}
                    <Text
                        accessibilityRole="link"
                        onPress={onRegisterPress}
                        style={styles.footerLink}
                    >
                        Sign up
                    </Text>
                </Text>
            }
            title="Welcome back"
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
                            returnKeyType="next"
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
                            autoComplete="current-password"
                            error={errors.password?.message}
                            label="Password"
                            onBlur={field.onBlur}
                            onChangeText={field.onChange}
                            placeholder="Your password"
                            rightAccessory={
                                <Pressable
                                    accessibilityLabel={
                                        isPasswordVisible
                                            ? 'Hide password'
                                            : 'Show password'
                                    }
                                    accessibilityRole="button"
                                    accessibilityState={{
                                        selected: isPasswordVisible,
                                    }}
                                    hitSlop={spacing.sm}
                                    onPress={() =>
                                        setIsPasswordVisible(!isPasswordVisible)
                                    }
                                    style={styles.passwordVisibilityButton}
                                >
                                    {isPasswordVisible ? (
                                        <EyeSlash
                                            color={colors.onboardingBackground}
                                            size={18}
                                        />
                                    ) : (
                                        <Eye
                                            color={colors.onboardingBackground}
                                            size={18}
                                        />
                                    )}
                                </Pressable>
                            }
                            secureTextEntry={!isPasswordVisible}
                            textContentType="password"
                            value={field.value}
                        />
                    )}
                />
                <Pressable
                    accessibilityRole="link"
                    onPress={onForgotPasswordPress}
                    style={styles.forgotButton}
                >
                    <Text style={styles.forgotText}>Forgot password?</Text>
                </Pressable>
                {submitError ? (
                    <Text accessibilityLiveRegion="polite" style={styles.error}>
                        {submitError}
                    </Text>
                ) : null}
                <FormActionButton
                    disabled={isSubmitting}
                    onPress={handleSubmit(handleLogin)}
                    title={isSubmitting ? 'Signing in…' : 'Sign in'}
                />
            </View>
        </AuthScreenLayout>
    )
}

const styles = StyleSheet.create({
    forgotButton: {
        alignSelf: 'flex-start',
        marginBottom: 16,
        marginTop: -spacing.xl,
        minHeight: spacing.touchTarget,
        justifyContent: 'center',
    },
    passwordVisibilityButton: {
        alignItems: 'center',
        height: spacing.touchTarget,
        justifyContent: 'center',
        width: spacing.touchTarget,
    },
    forgotText: {
        color: colors.onboardingPurple,
        fontFamily: typography.fontFamily,
        fontSize: 13,
        fontWeight: '700',
    },
    footerText: {
        color: colors.onboardingMuted,
        fontFamily: typography.fontFamily,
        fontSize: 13,
        lineHeight: 20,
        textAlign: 'center',
    },
    footerLink: { color: colors.white, fontWeight: '700' },
    error: {
        color: colors.danger,
        fontFamily: typography.fontFamily,
        fontSize: 13,
        marginBottom: spacing.md,
    },
})
