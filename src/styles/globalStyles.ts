import { StyleSheet } from 'react-native'

import { colors } from './colors'
import { spacing } from './spacing'
import { typography } from './typography'

export const globalStyles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    centered: { alignItems: 'center', justifyContent: 'center' },
    content: { flex: 1, paddingHorizontal: spacing.md },
    formFieldLabel: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 15,
        fontWeight: '500',
        marginBottom: spacing.xxs,
    },
    formErrorText: {
        color: colors.danger,
        fontFamily: typography.fontFamily,
        fontSize: 12,
    },
})
