import { StyleSheet } from 'react-native'

import { colors } from './colors'
import { spacing } from './spacing'

export const globalStyles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    centered: { alignItems: 'center', justifyContent: 'center' },
    content: { flex: 1, paddingHorizontal: spacing.md },
})
