import { Pressable, StyleSheet, Text, View } from 'react-native'

import { colors } from '../../styles/colors'
import { spacing } from '../../styles/spacing'
import { typography } from '../../styles/typography'

type AuthButtonProps = {
    disabled?: boolean
    onPress: () => void
    title: string
}

export const AuthButton = ({
    disabled = false,
    onPress,
    title,
}: AuthButtonProps) => {
    return (
        <Pressable
            accessibilityRole="button"
            disabled={disabled}
            onPress={onPress}
            style={({ pressed }) => [
                styles.button,
                disabled ? styles.disabled : null,
                pressed && !disabled ? styles.pressed : null,
            ]}
        >
            <View style={styles.buttonSurface}>
                <Text style={styles.buttonText}>{title.toUpperCase()}</Text>
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
    buttonText: {
        color: colors.white,
        fontFamily: typography.fontFamily,
        fontSize: 14,
        fontWeight: '700',
    },
    disabled: { opacity: 0.55 },
    pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
})
