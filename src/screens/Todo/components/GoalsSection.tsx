import { useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { Plus, Trash } from 'phosphor-react-native'

import { colors } from '../../../styles/colors'
import { spacing } from '../../../styles/spacing'
import { typography } from '../../../styles/typography'
import type { AddGoalFormData } from '../addGoalSchema'
import type { TodoGoalCardData, TodoGoalHabitOption } from '../todoGoals.types'
import { AddGoalModal } from './AddGoalModal'

type GoalsSectionProps = {
    goals: readonly TodoGoalCardData[]
    habitOptions: readonly TodoGoalHabitOption[]
    onCreateGoal: (data: AddGoalFormData) => Promise<void>
    onDeleteGoal: (goal: TodoGoalCardData) => Promise<void>
}

const getStatusLabel = (status: string) => {
    if (status === 'completed') return 'Completed'
    if (status === 'overdue') return 'Overdue'
    return 'In progress'
}

const formatDate = (date: Date) =>
    date.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })

export const GoalsSection = ({
    goals,
    habitOptions,
    onCreateGoal,
    onDeleteGoal,
}: GoalsSectionProps) => {
    const [isAddGoalModalVisible, setIsAddGoalModalVisible] = useState(false)

    const confirmDelete = (goal: TodoGoalCardData) => {
        Alert.alert('Delete goal?', 'This goal will be removed.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                    onDeleteGoal(goal).catch(() =>
                        Alert.alert(
                            'Unable to delete goal',
                            'Please try again.',
                        ),
                    )
                },
            },
        ])
    }

    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleBlock}>
                    <Text style={styles.sectionTitle}>Goals</Text>
                    <Text style={styles.sectionSubtitle}>
                        Track progress for one habit or a group.
                    </Text>
                </View>
                <Pressable
                    accessibilityLabel="Add goal"
                    accessibilityRole="button"
                    disabled={habitOptions.length === 0}
                    onPress={() => setIsAddGoalModalVisible(true)}
                    style={[
                        styles.addButton,
                        habitOptions.length === 0 && styles.disabledButton,
                    ]}
                >
                    <Plus color={colors.accentStrong} size={18} weight="bold" />
                    <Text style={styles.addButtonText}>Add goal</Text>
                </Pressable>
            </View>

            {goals.length ? (
                <View style={styles.goalList}>
                    {goals.map((goal, index) => (
                        <View
                            key={`${goal.type}-${goal.id}`}
                            style={[
                                styles.goalCard,
                                index < goals.length - 1 &&
                                    styles.goalCardBorder,
                            ]}
                        >
                            <View style={styles.goalHeader}>
                                <View style={styles.goalTitleBlock}>
                                    <Text style={styles.goalTitle}>
                                        {goal.title}
                                    </Text>
                                    <Text style={styles.goalTerm}>
                                        {goal.termLabel}
                                    </Text>
                                </View>
                                <Pressable
                                    accessibilityLabel={`Delete ${goal.title} goal`}
                                    accessibilityRole="button"
                                    onPress={() => confirmDelete(goal)}
                                    style={styles.deleteButton}
                                >
                                    <Trash
                                        color={colors.textMuted}
                                        size={18}
                                        weight="regular"
                                    />
                                </Pressable>
                            </View>
                            <Text style={styles.goalDescription}>
                                {goal.description}
                            </Text>
                            {goal.type === 'group' ? (
                                <Text style={styles.habitNames}>
                                    {goal.includedHabitTitles.join(' · ')}
                                </Text>
                            ) : null}
                            <View style={styles.progressHeader}>
                                <Text style={styles.progressCaption}>
                                    {goal.type === 'habit'
                                        ? `${goal.currentValue} of ${goal.targetValue} sessions`
                                        : `${goal.actualPercentage}% consistency · ${goal.targetPercentage}% target`}
                                </Text>
                                <Text style={styles.progressPercent}>
                                    {goal.progress}%
                                </Text>
                            </View>
                            <View
                                accessibilityLabel={`${goal.progress}% of goal reached`}
                                accessibilityRole="progressbar"
                                style={styles.progressTrack}
                            >
                                <View
                                    style={[
                                        styles.progressFill,
                                        { width: `${goal.progress}%` },
                                    ]}
                                />
                            </View>
                            <View style={styles.goalFooter}>
                                <Text
                                    style={[
                                        styles.status,
                                        goal.status === 'completed' &&
                                            styles.completedStatus,
                                        goal.status === 'overdue' &&
                                            styles.overdueStatus,
                                    ]}
                                >
                                    {getStatusLabel(goal.status)}
                                </Text>
                                <Text style={styles.dueDate}>
                                    Due {formatDate(goal.dueDate)}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            ) : (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>No goals yet</Text>
                    <Text style={styles.emptyText}>
                        Set a target and follow your habit progress over time.
                    </Text>
                </View>
            )}

            <AddGoalModal
                habitOptions={habitOptions}
                isVisible={isAddGoalModalVisible}
                onClose={() => setIsAddGoalModalVisible(false)}
                onCreateGoal={onCreateGoal}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    section: { marginTop: spacing.xl },
    sectionHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    sectionTitleBlock: { flex: 1, paddingRight: spacing.sm },
    sectionTitle: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 21,
        fontWeight: '600',
    },
    sectionSubtitle: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 12,
        marginTop: 3,
    },
    addButton: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: spacing.xs,
        minHeight: 42,
        paddingLeft: spacing.sm,
    },
    disabledButton: { opacity: 0.45 },
    addButtonText: {
        color: colors.accentStrong,
        fontFamily: typography.fontFamily,
        fontSize: 12,
        fontWeight: '600',
    },
    goalList: {
        borderColor: colors.border,
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    goalCard: { padding: spacing.md },
    goalCardBorder: { borderBottomColor: colors.border, borderBottomWidth: 1 },
    goalHeader: {
        alignItems: 'flex-start',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    goalTitleBlock: { flex: 1, paddingRight: spacing.sm },
    goalTitle: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 16,
        fontWeight: '600',
    },
    goalTerm: {
        color: colors.accentStrong,
        fontFamily: typography.fontFamily,
        fontSize: 11,
        fontWeight: '600',
        marginTop: 3,
    },
    deleteButton: {
        alignItems: 'center',
        height: spacing.touchTarget,
        justifyContent: 'center',
        marginTop: -spacing.xs,
        width: spacing.touchTarget,
    },
    goalDescription: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 13,
        lineHeight: 18,
        marginTop: spacing.sm,
    },
    habitNames: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 11,
        lineHeight: 16,
        marginTop: spacing.xs,
    },
    progressHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.md,
    },
    progressCaption: {
        color: colors.textMuted,
        flex: 1,
        fontFamily: typography.fontFamily,
        fontSize: 11,
    },
    progressPercent: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 12,
        fontWeight: '700',
    },
    progressTrack: {
        backgroundColor: colors.surfaceMuted,
        borderRadius: 5,
        height: 7,
        marginTop: spacing.xs,
        overflow: 'hidden',
    },
    progressFill: {
        backgroundColor: colors.accentStrong,
        borderRadius: 5,
        height: '100%',
    },
    goalFooter: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.sm,
    },
    status: {
        color: colors.accentStrong,
        fontFamily: typography.fontFamily,
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    completedStatus: { color: colors.success },
    overdueStatus: { color: colors.danger },
    dueDate: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 11,
    },
    emptyState: {
        alignItems: 'center',
        borderColor: colors.border,
        borderRadius: 16,
        borderWidth: 1,
        padding: spacing.lg,
    },
    emptyTitle: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 15,
        fontWeight: '600',
    },
    emptyText: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 12,
        marginTop: spacing.xs,
        textAlign: 'center',
    },
})
