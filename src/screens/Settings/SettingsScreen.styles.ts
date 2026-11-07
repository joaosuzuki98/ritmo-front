import { StyleSheet } from 'react-native'

import { colors } from '../../styles/colors'
import { spacing } from '../../styles/spacing'
import { typography } from '../../styles/typography'

export const settingsScreenStyles = StyleSheet.create({
    scrollContent: {
        backgroundColor: colors.background,
        flexGrow: 1,
        paddingBottom: spacing.xl + spacing.lg,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
    },
    sectionTitle: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 23,
        fontWeight: '500',
        marginBottom: spacing.lg,
    },
    field: { marginBottom: spacing.lg },
    notificationsSection: { marginTop: spacing.lg },
    checkboxList: { gap: spacing.lg },
    priorityPicker: { marginTop: spacing.lg },
    inlineMessage: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 13,
        lineHeight: 19,
        marginTop: spacing.md,
    },
    inlineAction: {
        color: colors.accentStrong,
        fontFamily: typography.fontFamily,
        fontSize: 14,
        fontWeight: '700',
        marginTop: spacing.xs,
    },
    errorMessage: {
        color: colors.danger,
        fontFamily: typography.fontFamily,
        fontSize: 13,
        marginTop: spacing.sm,
    },
    dangerSection: { marginTop: spacing.xl },
    dangerTitle: {
        color: colors.dayCount,
        fontFamily: typography.fontFamily,
        fontSize: 23,
        fontWeight: '500',
        marginBottom: spacing.lg,
    },
    deleteButton: {
        alignItems: 'center',
        borderColor: colors.dayCount,
        borderRadius: 6,
        borderWidth: 1.5,
        justifyContent: 'center',
        minHeight: 52,
    },
    deleteButtonText: {
        color: colors.dayCount,
        fontFamily: typography.fontFamily,
        fontSize: 16,
        fontWeight: '600',
    },
})
