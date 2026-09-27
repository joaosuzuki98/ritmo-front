import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle } from 'phosphor-react-native'
import { Controller, useForm } from 'react-hook-form'
import { StyleSheet, Text, View } from 'react-native'

import { AuthButton } from '../../components/AuthButton/AuthButton'
import { AuthScreenLayout } from '../../components/AuthScreenLayout/AuthScreenLayout'
import { AuthTextInput } from '../../components/AuthTextInput/AuthTextInput'
import { colors } from '../../styles/colors'
import { spacing } from '../../styles/spacing'
import { typography } from '../../styles/typography'
import {
    forgotPasswordSchema,
    type ForgotPasswordFormData,
} from './forgotPasswordSchema'

type ForgotPasswordScreenProps = {
    onBack: () => void
}

export const ForgotPasswordScreen = ({ onBack }: ForgotPasswordScreenProps) => {
    const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)
    const {
        control,
        formState: { errors },
        handleSubmit,
    } = useForm<ForgotPasswordFormData>({
        defaultValues: { email: '' },
        resolver: zodResolver(forgotPasswordSchema),
    })

    const handleRequest = ({ email }: ForgotPasswordFormData) => {
        setSubmittedEmail(email.trim())
    }

    return (
        <AuthScreenLayout
            description={
                submittedEmail
                    ? 'Se este endereço estiver cadastrado, você receberá as instruções para redefinir sua senha.'
                    : 'Tudo bem. Informe seu e-mail e vamos ajudar você a recuperar o acesso.'
            }
            footer={
                submittedEmail ? undefined : (
                    <Text
                        accessibilityRole="link"
                        onPress={onBack}
                        style={styles.footerLink}
                    >
                        Voltar para entrar
                    </Text>
                )
            }
            title={submittedEmail ? 'Confira seu e-mail' : 'Recuperar senha'}
        >
            {submittedEmail ? (
                <View>
                    <View style={styles.successCard}>
                        <CheckCircle
                            color={colors.success}
                            size={24}
                            weight="fill"
                        />
                        <Text style={styles.successText}>{submittedEmail}</Text>
                    </View>
                    <AuthButton onPress={onBack} title="Voltar para entrar" />
                </View>
            ) : (
                <View>
                    <Controller
                        control={control}
                        name="email"
                        render={({ field }) => (
                            <AuthTextInput
                                autoComplete="email"
                                error={errors.email?.message}
                                keyboardType="email-address"
                                label="E-mail cadastrado"
                                onBlur={field.onBlur}
                                onChangeText={field.onChange}
                                placeholder="voce@email.com"
                                returnKeyType="done"
                                textContentType="emailAddress"
                                value={field.value}
                            />
                        )}
                    />
                    <AuthButton
                        onPress={handleSubmit(handleRequest)}
                        title="Enviar instruções"
                    />
                </View>
            )}
        </AuthScreenLayout>
    )
}

const styles = StyleSheet.create({
    successCard: {
        alignItems: 'center',
        backgroundColor: colors.surfaceInput,
        borderRadius: 4,
        flexDirection: 'row',
        marginBottom: spacing.lg,
        minHeight: 58,
        paddingHorizontal: spacing.md,
    },
    footerLink: {
        color: colors.onboardingPurple,
        fontFamily: typography.onboardingFontFamily,
        fontSize: typography.onboardingAction.fontSize,
        textDecorationLine: 'underline',
    },
    successText: {
        color: colors.text,
        flex: 1,
        fontFamily: typography.fontFamily,
        fontSize: 14,
        marginLeft: spacing.sm,
    },
})
