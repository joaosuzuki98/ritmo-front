import { useEffect, useState } from 'react'
import {
    CheckCircle,
    Flame,
    PencilSimple,
    Trash,
    Warning,
} from 'phosphor-react-native'
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native'

import { getHabitStatusPresentation } from '../../../constants/habitStatuses'
import { habitRequirementStatusLabels } from '../../../constants/habitRequirementStatuses'
import { weekDays, weekDayLabels } from '../../../constants/weekDays'
import { FormActionButton } from '../../../components/FormActionButton'
import { colors } from '../../../styles/colors'
import { getResponsiveScale } from '../../../styles/responsive'
import { spacing } from '../../../styles/spacing'
import { typography } from '../../../styles/typography'
import type { HabitCardViewData } from '../habitDashboard.types'
import { BottomSheetLayout } from '../../../components/BottomSheetLayout'
import { theme } from '../../../styles/theme'

type HabitDetailsModalProps = {
    habit: HabitCardViewData | null
    isVisible: boolean
    onClose: () => void
    onEdit: () => void
    onDelete: () => void
    onLogProgress: () => void
}

const formatDate = (date?: Date) =>
    date
        ? date.toLocaleDateString(undefined, {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
          })
        : 'Not set'

const formatTime = (date?: Date) =>
    date
        ? date.toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
          })
        : 'Not set'

const formatDuration = (minutes?: number) => {
    if (!minutes) return 'Not set'
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes ? `${hours}h ${remainingMinutes}min` : `${hours}h`
}

const getStatusColor = (status: string) => {
    if (status === 'completed') return colors.success
    if (status === 'skipped') return colors.danger
    if (status === 'partial') return colors.priorityMedium
    return colors.textMuted
}

export const HabitDetailsModal = ({
    habit: incomingHabit,
    isVisible,
    onClose,
    onEdit,
    onDelete,
    onLogProgress,
}: HabitDetailsModalProps) => {
    const { height, width } = useWindowDimensions()
    const scale = getResponsiveScale(width)
    const daySize = Math.min(
        42 * scale,
        (width - spacing.lg * scale * 2 - 6 * 7) / 7,
    )
    const [retainedHabit, setRetainedHabit] = useState(incomingHabit)
    const habit = incomingHabit ?? retainedHabit

    useEffect(() => {
        if (incomingHabit) setRetainedHabit(incomingHabit)
    }, [incomingHabit])

    const handleDismiss = () => {
        if (!incomingHabit) setRetainedHabit(null)
    }

    if (!habit) return null

    const history = habit.completionHistory ?? []
    const latestNote = history.find(record => record.note)?.note
    const hasDistractionLock = history.some(
        record => record.distractionLockEnabled,
    )
    const stats = [
        { label: 'Completed', value: String(habit.completedCount ?? 0) },
        { label: 'Partial', value: String(habit.partialCount ?? 0) },
        { label: 'Not done', value: String(habit.skippedCount ?? 0) },
        {
            label: 'Success rate',
            value: `${Math.round(habit.successRate ?? 0)}%`,
        },
        { label: 'Current streak', value: `${habit.currentStreak ?? 0} days` },
    ]

    return (
        <BottomSheetLayout
            backdropColor={theme.colors.bottomSheetBackdropStrong}
            closeAccessibilityLabel="Close habit details"
            headerStyle={{ marginBottom: theme.spacing.md }}
            heightMode="fixed"
            isVisible={isVisible}
            onClose={onClose}
            onDismiss={handleDismiss}
            sheetStyle={[
                styles.sheet,
                {
                    height: Math.min(
                        height * theme.bottomSheet.heightRatio,
                        theme.bottomSheet.detailsMaxHeight * scale,
                    ),
                },
            ]}
            shouldAvoidKeyboard={false}
            title="Habit details"
            titleStyle={{
                fontSize: theme.bottomSheet.detailsTitle.fontSize * scale,
            }}
        >
            <ScrollView
                contentContainerStyle={{ paddingBottom: 24 * scale }}
                showsVerticalScrollIndicator={false}
            >
                <View
                    style={[
                        styles.titleBlock,
                        { borderLeftColor: habit.priorityColor },
                    ]}
                >
                    <View style={styles.titleHeader}>
                        {habit.status === 'completed' ? (
                            <View style={styles.statusIcon}>
                                <CheckCircle
                                    color={colors.success}
                                    size={24 * scale}
                                    weight="fill"
                                />
                            </View>
                        ) : habit.status === 'partial' ? (
                            <View style={styles.statusIcon}>
                                <Warning
                                    color={colors.warning}
                                    size={24 * scale}
                                    weight="fill"
                                />
                            </View>
                        ) : null}
                        <View style={styles.titleCopy}>
                            <Text
                                style={[styles.title, { fontSize: 34 * scale }]}
                            >
                                {habit.title}
                            </Text>
                            {habit.categoryLabel ? (
                                <Text style={styles.category}>
                                    {habit.categoryLabel}
                                </Text>
                            ) : null}
                        </View>
                        <View style={styles.titleActions}>
                            <Pressable
                                accessibilityLabel={`Edit ${habit.title}`}
                                accessibilityRole="button"
                                onPress={onEdit}
                                style={styles.titleActionButton}
                            >
                                <PencilSimple
                                    color={colors.text}
                                    size={24 * scale}
                                />
                            </Pressable>
                            <Pressable
                                accessibilityLabel={`Delete ${habit.title}`}
                                accessibilityRole="button"
                                onPress={onDelete}
                                style={styles.titleActionButton}
                            >
                                <Trash
                                    color={colors.danger}
                                    size={24 * scale}
                                />
                            </Pressable>
                        </View>
                    </View>
                </View>

                {habit.isFocusOfDay || hasDistractionLock ? (
                    <View style={styles.badgesRow}>
                        {habit.isFocusOfDay ? (
                            <View style={styles.focusBadge}>
                                <Text style={styles.focusBadgeText}>
                                    Focus of the day
                                </Text>
                            </View>
                        ) : null}
                        {hasDistractionLock ? (
                            <View style={styles.lockBadge}>
                                <Text style={styles.lockBadgeText}>
                                    Distraction lock used
                                </Text>
                            </View>
                        ) : null}
                    </View>
                ) : null}

                <FormActionButton
                    accessibilityLabel={`Record today's progress for ${habit.title}`}
                    disabled={habit.isBlocked}
                    onPress={onLogProgress}
                    title={
                        habit.isBlocked
                            ? 'Complete requirements first'
                            : 'Record today’s progress'
                    }
                    containerStyle={styles.logProgressButton}
                />

                {habit.description ? (
                    <Text style={styles.description}>{habit.description}</Text>
                ) : null}

                {habit.dependencyHabitTitle || habit.conditionHabitTitle ? (
                    <>
                        <Text style={styles.sectionTitle}>Requirements</Text>
                        <View style={styles.requirementsBox}>
                            {habit.dependencyHabitTitle ? (
                                <Text style={styles.requirementText}>
                                    Complete “{habit.dependencyHabitTitle}”
                                    first today.
                                </Text>
                            ) : null}
                            {habit.conditionHabitTitle ? (
                                <Text style={styles.requirementText}>
                                    “{habit.conditionHabitTitle}” must be marked
                                    as{' '}
                                    {habit.conditionStatus
                                        ? habitRequirementStatusLabels[
                                              habit.conditionStatus as keyof typeof habitRequirementStatusLabels
                                          ]
                                        : 'the required status'}
                                    .
                                </Text>
                            ) : null}
                        </View>
                    </>
                ) : null}

                <Text style={styles.sectionTitle}>Schedule</Text>
                <View style={styles.scheduleDaysSection}>
                    <Text style={styles.detailLabel}>Days</Text>
                    <View style={styles.scheduleDaysRow}>
                        {weekDays.map(day => {
                            const isSelected = habit.weekDays.includes(day)
                            return (
                                <View
                                    key={day}
                                    style={[
                                        styles.scheduleDayCircle,
                                        {
                                            borderRadius: daySize / 2,
                                            height: daySize,
                                            width: daySize,
                                        },
                                        isSelected &&
                                            styles.scheduleDayCircleSelected,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.scheduleDayText,
                                            isSelected &&
                                                styles.scheduleDayTextSelected,
                                        ]}
                                    >
                                        {weekDayLabels[day].slice(0, 2)}
                                    </Text>
                                </View>
                            )
                        })}
                    </View>
                </View>
                <View style={styles.detailGrid}>
                    {[
                        {
                            label: 'Estimated duration',
                            value: formatDuration(
                                habit.estimatedDurationMinutes,
                            ),
                        },
                        {
                            label: 'Preferred time',
                            value: formatTime(habit.preferredTime),
                        },
                    ].map(detail => (
                        <View key={detail.label} style={styles.detailItem}>
                            <Text style={styles.detailLabel}>
                                {detail.label}
                            </Text>
                            <Text style={styles.detailValue}>
                                {detail.value}
                            </Text>
                        </View>
                    ))}
                </View>

                {habit.seasonalStart || habit.seasonalEnd ? (
                    <View style={styles.seasonRow}>
                        <Text style={styles.detailLabel}>Season</Text>
                        <Text style={styles.detailValue}>
                            {formatDate(habit.seasonalStart)}
                            {'  -  '}
                            {formatDate(habit.seasonalEnd)}
                        </Text>
                    </View>
                ) : null}

                <Text style={styles.sectionTitle}>Progress</Text>
                <View style={styles.statsRow}>
                    {stats.map(stat => (
                        <View key={stat.label} style={styles.statItem}>
                            <Text style={styles.statValue}>{stat.value}</Text>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.streakRow}>
                    <Flame
                        color={colors.success}
                        size={24 * scale}
                        weight="fill"
                    />
                    <Text style={styles.streakText}>
                        Longest streak: {habit.longestStreak ?? 0} days
                    </Text>
                </View>

                <Text style={styles.sectionTitle}>Recent activity</Text>
                {history.length ? (
                    <View style={styles.historyGrid}>
                        {history.slice(0, 14).map((record, index) => (
                            <View
                                key={`${record.date.toISOString()}-${index}`}
                                style={[
                                    styles.historyItem,
                                    {
                                        borderColor: getStatusColor(
                                            record.status,
                                        ),
                                    },
                                ]}
                            >
                                <Text style={styles.historyDate}>
                                    {formatDate(record.date)}
                                </Text>
                                <Text
                                    style={[
                                        styles.historyStatus,
                                        {
                                            color: getStatusColor(
                                                record.status,
                                            ),
                                        },
                                    ]}
                                >
                                    {
                                        getHabitStatusPresentation(
                                            record.status,
                                        ).label
                                    }
                                </Text>
                                {record.completionTime ? (
                                    <Text style={styles.historyDetail}>
                                        {formatTime(record.completionTime)}
                                    </Text>
                                ) : null}
                                {record.incompletionReason ? (
                                    <Text style={styles.historyDetail}>
                                        Reason: {record.incompletionReason}
                                    </Text>
                                ) : null}
                                {record.note ? (
                                    <Text style={styles.historyDetail}>
                                        {record.note}
                                    </Text>
                                ) : null}
                            </View>
                        ))}
                    </View>
                ) : (
                    <Text style={styles.emptyHistory}>
                        No activity recorded yet.
                    </Text>
                )}

                {latestNote ? (
                    <View style={styles.noteBox}>
                        <Text style={styles.detailLabel}>Latest note</Text>
                        <Text style={styles.noteText}>{latestNote}</Text>
                    </View>
                ) : null}

                {habit.createdAt ? (
                    <Text style={styles.createdText}>
                        Created {formatDate(habit.createdAt)}
                    </Text>
                ) : null}
            </ScrollView>
        </BottomSheetLayout>
    )
}

const styles = StyleSheet.create({
    sheet: {
        borderColor: colors.border,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderWidth: 1,
        paddingTop: 18,
    },
    titleBlock: {
        borderLeftWidth: 5,
        marginBottom: 10,
        paddingLeft: 14,
    },
    titleHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    titleCopy: { flex: 1 },
    statusIcon: { marginRight: spacing.xs },
    titleActions: {
        alignItems: 'center',
        flexDirection: 'row',
        marginLeft: spacing.sm,
    },
    titleActionButton: {
        alignItems: 'center',
        height: spacing.touchTarget,
        justifyContent: 'center',
        width: spacing.touchTarget,
    },
    title: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontWeight: '500',
    },
    category: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 16,
        marginTop: 4,
    },
    badgesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 10,
        marginTop: 16,
    },
    logProgressButton: { marginTop: 24 },
    focusBadge: {
        backgroundColor: colors.accent,
        borderRadius: 8,
        paddingHorizontal: 11,
        paddingVertical: 7,
    },
    focusBadgeText: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 13,
    },
    lockBadge: {
        backgroundColor: colors.surfaceInput,
        borderRadius: 8,
        paddingHorizontal: 11,
        paddingVertical: 7,
    },
    lockBadgeText: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 13,
    },
    description: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 18,
        lineHeight: 27,
        marginTop: 22,
    },
    requirementsBox: {
        backgroundColor: colors.surfaceMuted,
        borderRadius: 10,
        gap: 7,
        paddingHorizontal: 13,
        paddingVertical: 11,
    },
    requirementText: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 15,
        lineHeight: 21,
    },
    sectionTitle: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 18,
        fontWeight: '500',
        marginBottom: 12,
        marginTop: 26,
    },
    detailGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    detailItem: {
        backgroundColor: colors.surfaceMuted,
        borderRadius: 10,
        flexGrow: 1,
        minWidth: '47%',
        paddingHorizontal: 13,
        paddingVertical: 11,
    },
    scheduleDaysSection: { marginBottom: 10 },
    scheduleDaysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    scheduleDayCircle: {
        alignItems: 'center',
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.border,
        borderWidth: 1,
        justifyContent: 'center',
    },
    scheduleDayCircleSelected: {
        backgroundColor: colors.accentStrong,
        borderColor: colors.accentStrong,
    },
    scheduleDayText: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 12,
    },
    scheduleDayTextSelected: { color: colors.text },
    detailLabel: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    detailValue: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 15,
        marginTop: 5,
    },
    seasonRow: {
        backgroundColor: colors.surfaceMuted,
        borderRadius: 10,
        marginTop: 10,
        paddingHorizontal: 13,
        paddingVertical: 11,
    },
    statsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statItem: {
        alignItems: 'center',
        width: '30%',
    },
    statValue: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 25,
        fontWeight: '500',
    },
    statLabel: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 12,
        marginTop: 4,
        textAlign: 'center',
    },
    streakRow: {
        alignItems: 'center',
        backgroundColor: colors.surfaceMuted,
        borderRadius: 10,
        flexDirection: 'row',
        marginTop: 15,
        paddingHorizontal: 13,
        paddingVertical: 11,
    },
    streakText: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 15,
        marginLeft: 9,
    },
    historyGrid: {
        gap: 8,
    },
    historyItem: {
        backgroundColor: colors.surfaceMuted,
        borderLeftWidth: 4,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    historyDate: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 14,
    },
    historyStatus: {
        fontFamily: typography.fontFamily,
        fontSize: 13,
        marginTop: 3,
    },
    historyDetail: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 13,
        marginTop: 4,
    },
    emptyHistory: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 15,
    },
    noteBox: {
        backgroundColor: colors.surfaceInput,
        borderRadius: 10,
        marginTop: 18,
        paddingHorizontal: 13,
        paddingVertical: 11,
    },
    noteText: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 15,
        lineHeight: 22,
        marginTop: 5,
    },
    createdText: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 12,
        marginTop: 22,
        textAlign: 'center',
    },
})
