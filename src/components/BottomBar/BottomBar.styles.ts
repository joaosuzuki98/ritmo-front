import { StyleSheet } from 'react-native'

import { colors } from '../../styles/colors'
import { spacing } from '../../styles/spacing'
import { typography } from '../../styles/typography'

export const bottomBarStyles = StyleSheet.create({
    container: {
        alignItems: 'stretch',
        backgroundColor: colors.surface,
        flexDirection: 'row',
        height: 112,
        justifyContent: 'space-around',
        paddingHorizontal: spacing.sm,
    },
    routeSlot: { flex: 1 },
    route: { alignItems: 'center', flex: 1, justifyContent: 'center' },
    routeIcon: { color: '#6875A4' },
    routeIconActive: { color: colors.text },
    routeLabel: {
        color: '#6875A4',
        fontFamily: typography.fontFamily,
        fontSize: 19,
        fontWeight: '300',
        marginTop: 5,
    },
    routeLabelActive: { color: colors.text },
    add: {
        alignItems: 'center',
        backgroundColor: colors.accent,
        borderTopLeftRadius: 72,
        borderTopRightRadius: 72,
        height: 166,
        justifyContent: 'center',
        marginHorizontal: 2,
        marginTop: -54,
        width: 108,
    },
    addIcon: { color: colors.text },
    addLabel: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 20,
        fontWeight: '300',
        marginTop: 2,
    },
})
