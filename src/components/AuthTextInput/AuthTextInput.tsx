import { StyleSheet, Text, TextInput, View } from 'react-native'
import type { TextInputProps } from 'react-native'

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
            <View
                style={[
                    styles.inputContainer,
                    error ? styles.inputError : null,
                ]}
            >
                <TextInput
                    accessibilityLabel={label}
                    autoCapitalize={autoCapitalize}
                    autoComplete={autoComplete}
                    autoCorrect={autoCorrect}
                    keyboardType={keyboardType}
                    onBlur={onBlur}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={colors.inputPlaceholder}
                    returnKeyType={returnKeyType}
                    secureTextEntry={secureTextEntry}
                    selectionColor={colors.accentStrong}
                    style={styles.input}
                    textContentType={textContentType}
                    underlineColorAndroid="transparent"
                    value={value}
                />
            </View>
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
    inputContainer: {
        alignItems: 'center',
        backgroundColor: colors.surfaceInput,
        borderRadius: 4,
        flexDirection: 'row',
        minHeight: 40,
        paddingHorizontal: spacing.sm,
    },
    inputError: { borderColor: colors.danger, borderWidth: 1 },
    input: {
        color: colors.white,
        flex: 1,
        fontFamily: typography.fontFamily,
        fontSize: 14,
        minWidth: 0,
        paddingHorizontal: 0,
        paddingVertical: spacing.xs,
    },
    error: {
        color: colors.danger,
        fontFamily: typography.fontFamily,
        fontSize: 12,
        marginTop: spacing.xs,
    },
})
