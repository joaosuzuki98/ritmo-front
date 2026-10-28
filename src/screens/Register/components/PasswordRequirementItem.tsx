import { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import { CheckFat } from 'phosphor-react-native'
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming,
} from 'react-native-reanimated'

import { colors } from '../../../styles/colors'
import { spacing } from '../../../styles/spacing'
import { typography } from '../../../styles/typography'

type PasswordRequirementItemProps = {
    isMet: boolean
    label: string
}

export const PasswordRequirementItem = ({
    isMet,
    label,
}: PasswordRequirementItemProps) => {
    const progress = useSharedValue(isMet ? 1 : 0)
    const iconScale = useSharedValue(1)

    useEffect(() => {
        progress.value = withTiming(isMet ? 1 : 0, { duration: 160 })

        if (isMet) {
            iconScale.value = withSequence(
                withTiming(1.05, { duration: 90 }),
                withTiming(1, { duration: 110 }),
            )
        } else {
            iconScale.value = withTiming(1, { duration: 120 })
        }
    }, [iconScale, isMet, progress])

    const textStyle = useAnimatedStyle(() => ({
        color: interpolateColor(
            progress.value,
            [0, 1],
            [colors.onboardingMuted, colors.white],
        ),
    }))
    const iconStyle = useAnimatedStyle(() => ({
        transform: [{ scale: iconScale.value }],
    }))

    return (
        <Animated.View
            accessibilityLabel={`${label}: ${
                isMet ? 'atendido' : 'não atendido'
            }`}
            accessibilityRole="text"
            style={styles.row}
        >
            <Animated.View style={iconStyle}>
                <CheckFat
                    color={isMet ? colors.passwordSuccess : colors.textMuted}
                    size={18}
                    weight="bold"
                />
            </Animated.View>
            <Animated.Text style={[styles.label, textStyle]}>
                {label}
            </Animated.Text>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    row: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: spacing.sm,
    },
    label: {
        fontFamily: typography.fontFamily,
        fontSize: 14,
    },
})
