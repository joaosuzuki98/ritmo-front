import { useEffect, useRef } from 'react'
import type React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { X } from 'phosphor-react-native'

import { FormTextInput } from '../../../components/FormTextInput'
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
    const inputRef = useRef<React.ElementRef<typeof FormTextInput>>(null)
    useEffect(() => {
        inputRef.current?.focus()
    }, [])
    return (
        <View style={styles.container}>
            <FormTextInput
                ref={inputRef}
                accessibilityLabel="Search habits by title"
                autoCapitalize="none"
                onChangeText={onChangeText}
                placeholder="Search habits"
                containerStyle={styles.searchField}
                value={value}
            />
            {value ? (
                <Pressable accessibilityLabel="Clear search" onPress={onClear}>
                    <Text style={styles.clearText}>Clear</Text>
                </Pressable>
            ) : null}
            <Pressable accessibilityLabel="Close search" onPress={onClose}>
                <X color={colors.text} size={24} />
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8,
        paddingBottom: 12,
    },
    searchField: { flex: 1 },
    clearText: {
        color: colors.text,
        fontFamily: typography.fontFamily,
    },
})
