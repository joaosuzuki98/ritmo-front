import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import {
    EnvelopeSimple,
    Eye,
    EyeSlash,
    LockKey,
    User,
} from 'phosphor-react-native'
import { Controller, useForm } from 'react-hook-form'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { AuthButton } from '../../components/AuthButton/AuthButton'
import { AuthScreenLayout } from '../../components/AuthScreenLayout/AuthScreenLayout'
import { AuthTextInput } from '../../components/AuthTextInput/AuthTextInput'
import { colors } from '../../styles/colors'
import { spacing } from '../../styles/spacing'
import { typography } from '../../styles/typography'
import { registerSchema, type RegisterFormData } from './registerSchema'

type RegisterScreenProps = {
    onBack: () => void
    onRegisterSuccess: () => void
}

export const RegisterScreen = ({
    onBack,
    onRegisterSuccess,
}: RegisterScreenProps) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false)
    const [isConfirmationVisible, setIsConfirmationVisible] = useState(false)
    const {
        control,
        formState: { errors },
        handleSubmit,
    } = useForm<RegisterFormData>({
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
        resolver: zodResolver(registerSchema),
    })

    const handleRegister = (_data: RegisterFormData) => onRegisterSuccess()

    return (
        <AuthScreenLayout
            description="Comece a construir uma rotina que combina com você."
            footer={
                <Text style={styles.footerText}>
                    Já tem uma conta?{' '}
                    <Text
                        accessibilityRole="link"
                        onPress={onBack}
                        style={styles.footerLink}
                    >
                        Entrar
                    </Text>
                </Text>
            }
            onBack={onBack}
            title="Crie sua conta"
        >
            <View>
                <Controller
                    control={control}
                    name="name"
                    render={({ field }) => (
                        <AuthTextInput
                            autoCapitalize="words"
                            autoComplete="name"
                            error={errors.name?.message}
                            icon={<User color={colors.textMuted} size={20} />}
                            label="Nome"
                            onBlur={field.onBlur}
                            onChangeText={field.onChange}
                            placeholder="Como podemos te chamar?"
                            returnKeyType="next"
                            textContentType="name"
                            value={field.value}
                        />
                    )}
                />
                <Controller
                    control={control}
                    name="email"
                    render={({ field }) => (
                        <AuthTextInput
                            autoComplete="email"
                            error={errors.email?.message}
                            icon={
                                <EnvelopeSimple
                                    color={colors.textMuted}
                                    size={20}
                                />
                            }
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
                            autoComplete="new-password"
                            error={errors.password?.message}
                            icon={
                                <LockKey color={colors.textMuted} size={20} />
                            }
                            label="Senha"
                            onBlur={field.onBlur}
                            onChangeText={field.onChange}
                            placeholder="Pelo menos 8 caracteres"
                            rightAccessory={
                                <Pressable
                                    accessibilityLabel={
                                        isPasswordVisible
                                            ? 'Ocultar senha'
                                            : 'Mostrar senha'
                                    }
                                    accessibilityRole="button"
                                    hitSlop={8}
                                    onPress={() =>
                                        setIsPasswordVisible(value => !value)
                                    }
                                    style={styles.visibilityButton}
                                >
                                    {isPasswordVisible ? (
                                        <EyeSlash
                                            color={colors.textMuted}
                                            size={20}
                                        />
                                    ) : (
                                        <Eye
                                            color={colors.textMuted}
                                            size={20}
                                        />
                                    )}
                                </Pressable>
                            }
                            secureTextEntry={!isPasswordVisible}
                            textContentType="newPassword"
                            value={field.value}
                        />
                    )}
                />
                <Controller
                    control={control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <AuthTextInput
                            autoComplete="new-password"
                            error={errors.confirmPassword?.message}
                            icon={
                                <LockKey color={colors.textMuted} size={20} />
                            }
                            label="Confirmar senha"
                            onBlur={field.onBlur}
                            onChangeText={field.onChange}
                            placeholder="Digite sua senha novamente"
                            rightAccessory={
                                <Pressable
                                    accessibilityLabel={
                                        isConfirmationVisible
                                            ? 'Ocultar confirmação de senha'
                                            : 'Mostrar confirmação de senha'
                                    }
                                    accessibilityRole="button"
                                    hitSlop={8}
                                    onPress={() =>
                                        setIsConfirmationVisible(
                                            value => !value,
                                        )
                                    }
                                    style={styles.visibilityButton}
                                >
                                    {isConfirmationVisible ? (
                                        <EyeSlash
                                            color={colors.textMuted}
                                            size={20}
                                        />
                                    ) : (
                                        <Eye
                                            color={colors.textMuted}
                                            size={20}
                                        />
                                    )}
                                </Pressable>
                            }
                            secureTextEntry={!isConfirmationVisible}
                            textContentType="newPassword"
                            value={field.value}
                        />
                    )}
                />
                <AuthButton
                    onPress={handleSubmit(handleRegister)}
                    title="Criar conta"
                />
            </View>
        </AuthScreenLayout>
    )
}

const styles = StyleSheet.create({
    visibilityButton: { marginLeft: spacing.sm, padding: spacing.xxs },
    footerText: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 13,
        lineHeight: 20,
        textAlign: 'center',
    },
    footerLink: { color: colors.text, fontWeight: '700' },
})
