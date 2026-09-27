import { forwardRef } from 'react'
import type React from 'react'
import {
    StyleSheet,
    TextInput,
    View,
    type StyleProp,
    type TextInputProps,
    type ViewStyle,
} from 'react-native'

import { colors } from '../../styles/colors'
import { spacing } from '../../styles/spacing'
import { typography } from '../../styles/typography'

export type FormTextInputProps = TextInputProps & {
    containerStyle?: StyleProp<ViewStyle>
    hasError?: boolean
}

export const FormTextInput = forwardRef<
    React.ElementRef<typeof TextInput>,
    FormTextInputProps
>(
    (
        {
            containerStyle,
            hasError = false,
            style,
            ...inputProps
        }: FormTextInputProps,
        ref,
    ) => (
        <View
            style={[
                styles.container,
                containerStyle,
                hasError && styles.containerError,
            ]}
        >
            <TextInput
                {...inputProps}
                ref={ref}
                placeholderTextColor={
                    inputProps.placeholderTextColor ?? colors.inputPlaceholder
                }
                selectionColor={colors.accentStrong}
                style={[styles.input, style]}
                underlineColorAndroid="transparent"
            />
        </View>
    ),
)

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        backgroundColor: colors.surfaceInput,
        borderRadius: 4,
        flexDirection: 'row',
        minHeight: 40,
        paddingHorizontal: spacing.sm,
    },
    containerError: { borderColor: colors.danger, borderWidth: 1 },
    input: {
        color: colors.white,
        flex: 1,
        fontFamily: typography.fontFamily,
        fontSize: 14,
        minWidth: 0,
        paddingHorizontal: 0,
        paddingVertical: spacing.xs,
    },
})
