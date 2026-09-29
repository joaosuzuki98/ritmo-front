import { StyleSheet } from 'react-native'

import { colors } from '../../styles/colors'
import { spacing } from '../../styles/spacing'
import { typography } from '../../styles/typography'

export const topBarStyles = StyleSheet.create({
    container: {
        alignItems: 'center',
        backgroundColor: colors.surface,
        flexDirection: 'row',
        minHeight: 104,
        paddingHorizontal: spacing.lg,
    },
    identity: { flex: 1, flexShrink: 1, marginLeft: spacing.md },
    name: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 29,
        fontWeight: '400',
    },
    profile: {
        alignItems: 'center',
        backgroundColor: '#D9D9D9',
        borderRadius: 38,
        height: 76,
        justifyContent: 'center',
        width: 76,
    },
    profileText: { color: colors.background, fontSize: 18, fontWeight: '700' },
    stats: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
    stat: { alignItems: 'center', flexDirection: 'row', gap: 6 },
    statValue: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 30,
        fontWeight: '400',
    },
    lightning: { color: '#3048C0' },
    fire: { color: '#E21E2A' },
    menu: { marginLeft: spacing.lg, padding: spacing.xs },
    menuText: { color: colors.text },
})
