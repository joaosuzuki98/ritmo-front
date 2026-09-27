import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { AuthButton } from '../../components/AuthButton/AuthButton'
import { AuthScreenLayout } from '../../components/AuthScreenLayout/AuthScreenLayout'
import { AuthTextInput } from '../../components/AuthTextInput/AuthTextInput'
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
                    : 'Não foi possível entrar. Tente novamente.',
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <AuthScreenLayout
            description="Entre para continuar cuidando do seu ritmo."
            footer={
                <Text style={styles.footerText}>
                    Ainda não tem uma conta?{' '}
                    <Text
                        accessibilityRole="link"
                        onPress={onRegisterPress}
                        style={styles.footerLink}
                    >
                        Criar conta
                    </Text>
                </Text>
            }
            title="Bem-vindo de volta"
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
                            label="E-mail"
                            onBlur={field.onBlur}
                            onChangeText={field.onChange}
                            placeholder="voce@email.com"
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
                            label="Senha"
                            onBlur={field.onBlur}
                            onChangeText={field.onChange}
                            placeholder="Sua senha"
                            secureTextEntry
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
                    <Text style={styles.forgotText}>Esqueceu a senha?</Text>
                </Pressable>
                {submitError ? (
                    <Text accessibilityLiveRegion="polite" style={styles.error}>
                        {submitError}
                    </Text>
                ) : null}
                <AuthButton
                    disabled={isSubmitting}
                    onPress={handleSubmit(handleLogin)}
                    title={isSubmitting ? 'Entrando…' : 'Entrar'}
                />
            </View>
        </AuthScreenLayout>
    )
}

const styles = StyleSheet.create({
    forgotButton: {
        alignSelf: 'flex-start',
        marginBottom: 16,
        marginTop: -16,
        minHeight: spacing.touchTarget,
        justifyContent: 'center',
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
