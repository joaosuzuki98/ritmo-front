import { Check } from 'phosphor-react-native'
import {
    Pressable,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native'

import { colors } from '../../../styles/colors'
import { getResponsiveScale } from '../../../styles/responsive'
import { spacing } from '../../../styles/spacing'
import { typography } from '../../../styles/typography'

type SettingsCheckboxProps = {
    checked: boolean
    label: string
    onPress: () => void
}

export const SettingsCheckbox = ({
    checked,
    label,
    onPress,
}: SettingsCheckboxProps) => {
    const { width } = useWindowDimensions()
    const scale = getResponsiveScale(width)

    return (
        <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            onPress={onPress}
            style={styles.container}
        >
            <View
                style={[
                    styles.checkbox,
                    {
                        height: 22 * scale,
                        marginTop: 2 * scale,
                        width: 22 * scale,
                    },
                    checked ? styles.checked : null,
                ]}
            >
                {checked ? (
                    <Check
                        color={colors.white}
                        size={17 * scale}
                        weight="bold"
                    />
                ) : null}
            </View>
            <Text
                style={[
                    styles.label,
                    { fontSize: typography.body.fontSize * scale },
                ]}
            >
                {label}
            </Text>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'flex-start',
        flexDirection: 'row',
        gap: spacing.sm,
        minHeight: spacing.touchTarget,
    },
    checkbox: {
        alignItems: 'center',
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.border,
        borderRadius: 5,
        borderWidth: 1,
        justifyContent: 'center',
    },
    checked: {
        backgroundColor: colors.accent,
        borderColor: colors.accent,
    },
    label: {
        color: colors.text,
        flex: 1,
        fontFamily: typography.fontFamily,
        lineHeight: 24,
    },
})
