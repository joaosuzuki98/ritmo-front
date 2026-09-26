import type { ReactNode } from 'react'
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
    icon: ReactNode
    label: string
    onBlur: () => void
    onChangeText: (value: string) => void
    placeholder: string
    rightAccessory?: ReactNode
    value: string
}

export const AuthTextInput = ({
    autoCapitalize = 'none',
    autoComplete,
    autoCorrect = false,
    error,
    icon,
    keyboardType,
    label,
    onBlur,
    onChangeText,
    placeholder,
    returnKeyType,
    rightAccessory,
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
                <View style={styles.leadingIcon}>{icon}</View>
                <TextInput
                    accessibilityLabel={label}
                    autoCapitalize={autoCapitalize}
                    autoComplete={autoComplete}
                    autoCorrect={autoCorrect}
                    keyboardType={keyboardType}
                    onBlur={onBlur}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textMuted}
                    returnKeyType={returnKeyType}
                    secureTextEntry={secureTextEntry}
                    selectionColor={colors.accentStrong}
                    style={styles.input}
                    textContentType={textContentType}
                    underlineColorAndroid="transparent"
                    value={value}
                />
                {rightAccessory}
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
    )
}

const styles = StyleSheet.create({
    field: { marginBottom: spacing.md },
    label: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 13,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    inputContainer: {
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: 15,
        borderWidth: 1,
        flexDirection: 'row',
        minHeight: 56,
        paddingHorizontal: spacing.md,
    },
    inputError: { borderColor: colors.danger },
    leadingIcon: { marginRight: spacing.sm },
    input: {
        color: colors.text,
        flex: 1,
        fontFamily: typography.fontFamily,
        fontSize: 15,
        minWidth: 0,
        paddingHorizontal: 0,
        paddingVertical: spacing.sm,
    },
    error: {
        color: colors.danger,
        fontFamily: typography.fontFamily,
        fontSize: 12,
        marginTop: spacing.xs,
    },
})
