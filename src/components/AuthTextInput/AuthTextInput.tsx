import { StyleSheet, Text, View } from 'react-native'
import type { TextInputProps } from 'react-native'

import { FormTextInput } from '../FormTextInput'
import { colors } from '../../styles/colors'
import { spacing } from '../../styles/spacing'
import { typography } from '../../styles/typography'

type AuthTextInputProps = Pick<
    TextInputProps,
    | 'autoCapitalize'
    | 'autoComplete'
    | 'autoCorrect'
    | 'keyboardType'
    | 'returnKeyType'
    | 'secureTextEntry'
    | 'textContentType'
> & {
    error?: string
    label: string
    onBlur: () => void
    onChangeText: (value: string) => void
    placeholder: string
    value: string
}

export const AuthTextInput = ({
    autoCapitalize = 'none',
    autoComplete,
    autoCorrect = false,
    error,
    keyboardType,
    label,
    onBlur,
    onChangeText,
    placeholder,
    returnKeyType,
    secureTextEntry,
    textContentType,
    value,
}: AuthTextInputProps) => {
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <FormTextInput
                accessibilityLabel={label}
                autoCapitalize={autoCapitalize}
                autoComplete={autoComplete}
                autoCorrect={autoCorrect}
                hasError={Boolean(error)}
                keyboardType={keyboardType}
                onBlur={onBlur}
                onChangeText={onChangeText}
                placeholder={placeholder}
                returnKeyType={returnKeyType}
                secureTextEntry={secureTextEntry}
                textContentType={textContentType}
                value={value}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
    )
}

const styles = StyleSheet.create({
    field: { marginBottom: spacing.xl },
    label: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 15,
        fontWeight: '500',
        marginBottom: spacing.xxs,
    },
    error: {
        color: colors.danger,
        fontFamily: typography.fontFamily,
        fontSize: 12,
        marginTop: spacing.xs,
    },
})
