import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'

import { colors } from '../../styles/colors'
import { spacing } from '../../styles/spacing'
import { typography } from '../../styles/typography'

export type FormActionButtonProps = {
    accessibilityLabel?: string
    containerStyle?: StyleProp<ViewStyle>
    disabled?: boolean
    isLoading?: boolean
    onPress: () => void
    title: string
    variant?: 'primary' | 'destructive'
}

export const FormActionButton = ({
    accessibilityLabel,
    containerStyle,
    disabled = false,
    isLoading = false,
    onPress,
    title,
    variant = 'primary',
}: FormActionButtonProps) => {
    const isDisabled = disabled || isLoading

    return (
        <Pressable
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="button"
            disabled={isDisabled}
            onPress={onPress}
            style={({ pressed }) => [
                styles.button,
                containerStyle,
                isDisabled && styles.disabled,
                pressed && !isDisabled && styles.pressed,
            ]}
        >
            <View
                style={[
                    styles.buttonSurface,
                    variant === 'destructive' && styles.destructiveSurface,
                ]}
            >
                {isLoading ? (
                    <ActivityIndicator color={colors.white} size="small" />
                ) : (
                    <Text style={styles.buttonText}>{title.toUpperCase()}</Text>
                )}
            </View>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: spacing.touchTarget,
        width: '100%',
    },
    buttonSurface: {
        alignItems: 'center',
        backgroundColor: colors.accent,
        borderRadius: 4,
        height: 32,
        justifyContent: 'center',
        width: '100%',
    },
    destructiveSurface: { backgroundColor: colors.danger },
    buttonText: {
        color: colors.white,
        fontFamily: typography.fontFamily,
        fontSize: 14,
        fontWeight: '700',
    },
    disabled: { opacity: 0.55 },
    pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
})
