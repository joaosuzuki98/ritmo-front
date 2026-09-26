import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ArrowRight } from 'phosphor-react-native'

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
            <View style={styles.buttonTextWrap}>
                <Text style={styles.buttonText}>{title}</Text>
            </View>
            <ArrowRight color={colors.white} size={20} weight="bold" />
        </Pressable>
    )
}

const styles = StyleSheet.create({
    button: {
        alignItems: 'center',
        backgroundColor: colors.accentStrong,
        borderRadius: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        minHeight: 56,
        paddingHorizontal: spacing.lg,
    },
    buttonTextWrap: { alignItems: 'center', flex: 1 },
    buttonText: {
        color: colors.white,
        fontFamily: typography.fontFamily,
        fontSize: 15,
        fontWeight: '700',
        marginLeft: 20,
    },
    disabled: { opacity: 0.55 },
    pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
})
