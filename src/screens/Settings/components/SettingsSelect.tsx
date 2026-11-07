import { Picker } from '@react-native-picker/picker'
import { StyleSheet, Text, View } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'

import { colors } from '../../../styles/colors'
import { spacing } from '../../../styles/spacing'
import { typography } from '../../../styles/typography'

export type SettingsSelectOption = {
    value: string
    label: string
}

type SettingsSelectProps = {
    accessibilityLabel: string
    containerStyle?: StyleProp<ViewStyle>
    disabled?: boolean
    label: string
    onSelect: (value: string) => void
    options: readonly SettingsSelectOption[]
    placeholder?: string
    value: string
}

export const SettingsSelect = ({
    accessibilityLabel,
    containerStyle,
    disabled = false,
    label,
    onSelect,
    options,
    placeholder,
    value,
}: SettingsSelectProps) => {
    return (
        <View style={containerStyle}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    accessibilityLabel={accessibilityLabel}
                    accessibilityState={{ disabled }}
                    dropdownIconColor={
                        disabled ? colors.bottomBarMuted : colors.textMuted
                    }
                    dropdownIconRippleColor="transparent"
                    enabled={!disabled}
                    mode="dropdown"
                    onValueChange={itemValue => {
                        if (!disabled) onSelect(String(itemValue))
                    }}
                    selectedValue={value}
                    style={[styles.picker, disabled && styles.pickerDisabled]}
                >
                    {placeholder ? (
                        <Picker.Item
                            color={colors.textMuted}
                            enabled={false}
                            label={placeholder}
                            style={styles.pickerItem}
                            value=""
                        />
                    ) : null}
                    {options.map(option => (
                        <Picker.Item
                            color={disabled ? colors.textMuted : colors.text}
                            key={option.value}
                            label={option.label}
                            style={styles.pickerItem}
                            value={option.value}
                        />
                    ))}
                </Picker>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    label: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 13,
        marginBottom: spacing.sm,
    },
    pickerContainer: {
        backgroundColor: colors.surfaceInput,
        borderRadius: 4,
        justifyContent: 'center',
        minHeight: 40,
    },
    picker: {
        backgroundColor: colors.surfaceInput,
        color: colors.text,
        fontFamily: typography.fontFamily,
    },
    pickerDisabled: { color: colors.bottomBarMuted },
    pickerItem: {
        backgroundColor: colors.surfaceInput,
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 14,
    },
})
