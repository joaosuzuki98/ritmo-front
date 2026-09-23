import { useEffect, useRef } from 'react'
import type React from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { X } from 'phosphor-react-native'

import { colors } from '../../../styles/colors'
import { typography } from '../../../styles/typography'

type SearchInputProps = {
    value: string
    onChangeText: (value: string) => void
    onClose: () => void
    onClear: () => void
}

export const SearchInput = ({
    value,
    onChangeText,
    onClose,
    onClear,
}: SearchInputProps) => {
    const inputRef = useRef<React.ElementRef<typeof TextInput>>(null)
    useEffect(() => {
        inputRef.current?.focus()
    }, [])
    return (
        <View
            style={{
                alignItems: 'center',
                flexDirection: 'row',
                gap: 8,
                paddingBottom: 12,
            }}
        >
            <TextInput
                ref={inputRef}
                accessibilityLabel="Search habits by title"
                autoCapitalize="none"
                onChangeText={onChangeText}
                placeholder="Search habits"
                placeholderTextColor={colors.textMuted}
                style={{
                    backgroundColor: colors.surfaceMuted,
                    borderRadius: 12,
                    color: colors.text,
                    flex: 1,
                    fontFamily: typography.fontFamily,
                    padding: 12,
                }}
                value={value}
            />
            {value ? (
                <Pressable accessibilityLabel="Clear search" onPress={onClear}>
                    <Text
                        style={{
                            color: colors.text,
                            fontFamily: typography.fontFamily,
                        }}
                    >
                        Clear
                    </Text>
                </Pressable>
            ) : null}
            <Pressable accessibilityLabel="Close search" onPress={onClose}>
                <X color={colors.text} size={24} />
            </Pressable>
        </View>
    )
}
