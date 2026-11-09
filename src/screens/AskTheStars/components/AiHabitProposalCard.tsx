import { Pressable, StyleSheet, Text, View } from 'react-native'

import { habitStatusCodes } from '../../../constants/habitStatuses'
import { priorityCodes } from '../../../constants/priorities'
import { weekDayLabels } from '../../../constants/weekDays'
import type { AiHabitProposal } from '../../../services/endpoints/ai'
import { colors } from '../../../styles/colors'
import { spacing } from '../../../styles/spacing'
import { typography } from '../../../styles/typography'
import { useTranslation } from '../../../localization/useTranslation'
import type { AiConversationMessage } from '../aiChatUtils'

type AiHabitProposalCardProps = {
    proposal: AiHabitProposal
    state: AiConversationMessage['proposalState']
    isSaving: boolean
    habitName?: string
    onConfirmCreate: () => void
    onConfirmUpdate: () => void
    onCancel: () => void
}

const formatWeekDays = (
    days: readonly number[],
    translate: (text: string) => string,
) =>
    days
        .map(day => translate(weekDayLabels[day as keyof typeof weekDayLabels]))
        .join(', ')

export const AiHabitProposalCard = ({
    proposal,
    state,
    isSaving,
    habitName,
    onConfirmCreate,
    onConfirmUpdate,
    onCancel,
}: AiHabitProposalCardProps) => {
    const { t } = useTranslation()
    const values =
        proposal.type === 'habit.create'
            ? {
                  ...proposal.habit,
                  weekDays:
                      proposal.habit.frequencyType === 'daily'
                          ? [1, 2, 3, 4, 5, 6, 7]
                          : proposal.habit.weekDays ?? [],
                  priority: proposal.habit.priority ?? 'medium',
                  status: proposal.habit.status ?? 'pending',
              }
            : proposal.changes.frequencyType === 'daily'
            ? {
                  ...proposal.changes,
                  weekDays: [1, 2, 3, 4, 5, 6, 7],
              }
            : proposal.changes
    const labels: Record<string, string> = {
        name: 'Habit name',
        description: 'Habit description',
        frequencyType: 'Frequency',
        weekDays: 'Days',
        estimatedDurationMinutes: 'Estimated duration',
        preferredTime: 'Preferred time',
        priority: 'Priority',
        status: 'Status',
    }
    const rows = (Object.entries(values) as [string, unknown][]).map(
        ([key, value]) => {
            let displayValue: string
            if (value === null) displayValue = t('Will be cleared')
            else if (key === 'weekDays' && Array.isArray(value))
                displayValue = value.length
                    ? formatWeekDays(value as number[], t)
                    : t('Choose days in form')
            else if (key === 'frequencyType')
                displayValue = t(String(value === 'daily' ? 'Daily' : 'Weekly'))
            else if (
                key === 'priority' &&
                typeof value === 'string' &&
                priorityCodes.some(code => code === value)
            )
                displayValue = t(
                    value === 'low'
                        ? 'Low'
                        : value === 'high'
                        ? 'High'
                        : 'Medium',
                )
            else if (
                key === 'status' &&
                typeof value === 'string' &&
                habitStatusCodes.some(code => code === value)
            )
                displayValue = t(
                    value === 'pending'
                        ? 'Pending'
                        : value === 'completed'
                        ? 'Completed'
                        : value === 'partial'
                        ? 'Partially completed'
                        : value === 'skipped'
                        ? 'Skipped'
                        : 'Paused',
                )
            else if (key === 'estimatedDurationMinutes')
                displayValue = `${value} ${t('minutes')}`
            else displayValue = String(value)

            const label = t(labels[key] ?? key)

            return (
                <View key={key} style={styles.row}>
                    <Text style={styles.label}>{label}</Text>
                    <Text style={styles.value}>{displayValue}</Text>
                </View>
            )
        },
    )

    return (
        <View style={styles.card}>
            <Text style={styles.title}>
                {t(
                    proposal.type === 'habit.create'
                        ? 'Suggested habit'
                        : 'Suggested change',
                )}
            </Text>
            {proposal.type === 'habit.update' ? (
                <Text style={styles.target}>
                    {habitName ?? `${t('Habit ID')}: ${proposal.entityId}`}
                </Text>
            ) : null}
            {rows}
            {state === 'applied' ? (
                <Text style={styles.statusText}>
                    {t(
                        'Saved on this device. It will sync when internet is available.',
                    )}
                </Text>
            ) : null}
            {state === 'cancelled' ? (
                <Text style={styles.statusText}>
                    {t('Proposal cancelled.')}
                </Text>
            ) : null}
            {state === 'invalid' ? (
                <Text style={styles.errorText}>
                    {t(
                        'This proposal cannot be applied because the habit was not included in the request.',
                    )}
                </Text>
            ) : null}
            {state === 'pending' ? (
                <View style={styles.actions}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t(
                            proposal.type === 'habit.create'
                                ? 'Review and complete details'
                                : 'Confirm change',
                        )}
                        disabled={isSaving}
                        onPress={
                            proposal.type === 'habit.create'
                                ? onConfirmCreate
                                : onConfirmUpdate
                        }
                        style={[
                            styles.confirmButton,
                            isSaving && styles.disabled,
                        ]}
                    >
                        <Text style={styles.confirmText}>
                            {isSaving
                                ? t('Saving…')
                                : t(
                                      proposal.type === 'habit.create'
                                          ? 'Review and complete details'
                                          : 'Confirm change',
                                  )}
                        </Text>
                    </Pressable>
                    <Pressable
                        accessibilityLabel={t('Cancel proposal')}
                        accessibilityRole="button"
                        disabled={isSaving}
                        onPress={onCancel}
                        style={styles.cancelButton}
                    >
                        <Text style={styles.cancelText}>
                            {t('Cancel proposal')}
                        </Text>
                    </Pressable>
                </View>
            ) : null}
        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        alignSelf: 'stretch',
        backgroundColor: colors.onboardingSurface,
        borderColor: colors.onboardingPurple,
        borderRadius: spacing.sm,
        borderWidth: 1,
        marginTop: spacing.sm,
        padding: spacing.md,
    },
    title: {
        color: colors.text,
        fontFamily: typography.semiboldFontFamily,
        fontSize: 16,
        marginBottom: spacing.xs,
    },
    target: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 12,
        marginBottom: spacing.xs,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: spacing.sm,
        paddingVertical: spacing.xxs,
    },
    label: {
        color: colors.textMuted,
        flex: 1,
        fontFamily: typography.fontFamily,
        fontSize: 13,
    },
    value: {
        color: colors.text,
        flex: 1,
        fontFamily: typography.fontFamily,
        fontSize: 13,
        textAlign: 'right',
    },
    actions: { gap: spacing.xs, marginTop: spacing.sm },
    confirmButton: {
        alignItems: 'center',
        backgroundColor: colors.onboardingAction,
        borderRadius: spacing.xs,
        justifyContent: 'center',
        minHeight: spacing.touchTarget,
        paddingHorizontal: spacing.sm,
    },
    confirmText: {
        color: colors.text,
        fontFamily: typography.semiboldFontFamily,
        textAlign: 'center',
    },
    cancelButton: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: spacing.touchTarget,
    },
    cancelText: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
    },
    disabled: { opacity: 0.5 },
    statusText: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 13,
        marginTop: spacing.sm,
    },
    errorText: {
        color: colors.danger,
        fontFamily: typography.fontFamily,
        fontSize: 13,
        marginTop: spacing.sm,
    },
})
