import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { StyleSheet, Text, View } from 'react-native'

import { AuthButton } from '../../components/AuthButton/AuthButton'
import { AuthScreenLayout } from '../../components/AuthScreenLayout/AuthScreenLayout'
import { AuthTextInput } from '../../components/AuthTextInput/AuthTextInput'
import { colors } from '../../styles/colors'
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
                            label="Nome"
                            onBlur={field.onBlur}
                            onChangeText={field.onChange}
                            placeholder="John Doe"
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
                            label="Senha"
                            onBlur={field.onBlur}
                            onChangeText={field.onChange}
                            placeholder=""
                            secureTextEntry
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
                            label="Confirmar senha"
                            onBlur={field.onBlur}
                            onChangeText={field.onChange}
                            placeholder=""
                            secureTextEntry
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
    footerText: {
        color: colors.onboardingMuted,
        fontFamily: typography.fontFamily,
        fontSize: 13,
        lineHeight: 20,
        textAlign: 'center',
    },
    footerLink: { color: colors.white, fontWeight: '700' },
})
