import { StyleSheet, Text, View } from 'react-native'

import { AuthScreenLayout } from '../../components/AuthScreenLayout/AuthScreenLayout'
import { FormActionButton } from '../../components/FormActionButton'
import { colors } from '../../styles/colors'
import { spacing } from '../../styles/spacing'
import { typography } from '../../styles/typography'

type ForgotPasswordScreenProps = {
    onBack: () => void
}

export const ForgotPasswordScreen = ({ onBack }: ForgotPasswordScreenProps) => (
    <AuthScreenLayout
        description="Sua conta e seus dados ficam armazenados localmente neste dispositivo."
        title="Recuperar senha"
    >
        <View>
            <Text style={styles.message}>
                A recuperação por e-mail não está disponível para contas locais.
                Volte para entrar com a senha usada no cadastro.
            </Text>
            <FormActionButton onPress={onBack} title="Voltar para entrar" />
        </View>
    </AuthScreenLayout>
)

const styles = StyleSheet.create({
    message: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 14,
        lineHeight: 22,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
})
