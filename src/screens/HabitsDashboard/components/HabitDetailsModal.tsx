import { useEffect, useState } from 'react'
import {
    CheckCircle,
    Flame,
    PencilSimple,
    Sparkle,
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
import { useTranslation } from '../../../localization/useTranslation'

type HabitDetailsModalProps = {
    habit: HabitCardViewData | null
    isVisible: boolean
    onClose: () => void
    onEdit: () => void
    onDelete: () => void
    onLogProgress: () => void
    onAnalyzeSchedule: () => void
}

const formatDate = (date: Date | undefined, language: 'en' | 'pt') =>
    date
        ? date.toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
          })
        : 'Not set'

const formatTime = (date: Date | undefined, language: 'en' | 'pt') =>
    date
        ? date.toLocaleTimeString(language === 'pt' ? 'pt-BR' : 'en-US', {
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
    if (status === 'skipped') return colors.dayCount
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
    onAnalyzeSchedule,
}: HabitDetailsModalProps) => {
    const { language, t } = useTranslation()
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
        {
            label: 'Current streak',
            value: t('{{count}} days', { count: habit.currentStreak ?? 0 }),
        },
    ]

    return (
        <BottomSheetLayout
            backdropColor={theme.colors.bottomSheetBackdropStrong}
            closeAccessibilityLabel={t('Close habit details')}
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
            title={t('Habit details')}
            titleStyle={{
                fontSize: theme.bottomSheet.detailsTitle.fontSize * scale,
            }}
        >
            <ScrollView
                contentContainerStyle={{ paddingBottom: 24 * scale }}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.titleBlock}>
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
                                style={[styles.title, { fontSize: 22 * scale }]}
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
                                accessibilityLabel={t(
                                    'Analyze the schedule for {{habitTitle}} with Ask the Stars',
                                    { habitTitle: habit.title },
                                )}
                                accessibilityRole="button"
                                onPress={onAnalyzeSchedule}
                                style={styles.titleActionButton}
                            >
                                <Sparkle
                                    color={colors.onboardingPurple}
                                    size={38 * scale}
                                    weight="regular"
                                />
                            </Pressable>
                            <Pressable
                                accessibilityLabel={t('Edit {{habitTitle}}', {
                                    habitTitle: habit.title,
                                })}
                                accessibilityRole="button"
                                onPress={onEdit}
                                style={styles.titleActionButton}
                            >
                                <PencilSimple
                                    color={colors.text}
                                    size={38 * scale}
                                />
                            </Pressable>
                            <Pressable
                                accessibilityLabel={t('Delete {{habitTitle}}', {
                                    habitTitle: habit.title,
                                })}
                                accessibilityRole="button"
                                onPress={onDelete}
                                style={styles.titleActionButton}
                            >
                                <Trash
                                    color={colors.dayCount}
                                    size={38 * scale}
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
                                    {t('Focus of the day')}
                                </Text>
                            </View>
                        ) : null}
                        {hasDistractionLock ? (
                            <View style={styles.lockBadge}>
                                <Text style={styles.lockBadgeText}>
                                    {t('Distraction lock used')}
                                </Text>
                            </View>
                        ) : null}
                    </View>
                ) : null}

                {habit.description ? (
                    <Text
                        style={[styles.description, { fontSize: 22 * scale }]}
                    >
                        {habit.description}
                    </Text>
                ) : null}

                <Text
                    style={[
                        styles.priorityText,
                        { color: habit.priorityColor },
                    ]}
                >
                    {t('Priority')}: {t(habit.priorityLabel)}
                </Text>

                <FormActionButton
                    accessibilityLabel={t(
                        "Record today's progress for {{habitTitle}}",
                        { habitTitle: habit.title },
                    )}
                    disabled={habit.isBlocked}
                    onPress={onLogProgress}
                    title={
                        habit.isBlocked
                            ? t('Complete requirements first')
                            : t('Record today’s progress')
                    }
                    containerStyle={styles.logProgressButton}
                />

                {habit.dependencyHabitTitle || habit.conditionHabitTitle ? (
                    <>
                        <Text style={styles.sectionTitle}>
                            {t('Requirements')}
                        </Text>
                        <View style={styles.requirementsBox}>
                            {habit.dependencyHabitTitle ? (
                                <Text style={styles.requirementText}>
                                    {t(
                                        'Complete “{{habitTitle}}” first today.',
                                        {
                                            habitTitle:
                                                habit.dependencyHabitTitle,
                                        },
                                    )}
                                </Text>
                            ) : null}
                            {habit.conditionHabitTitle ? (
                                <Text style={styles.requirementText}>
                                    {t(
                                        '“{{habitTitle}}” must be marked as {{status}}.',
                                        {
                                            habitTitle:
                                                habit.conditionHabitTitle,
                                            status: habit.conditionStatus
                                                ? t(
                                                      habitRequirementStatusLabels[
                                                          habit.conditionStatus as keyof typeof habitRequirementStatusLabels
                                                      ],
                                                  )
                                                : t('the required status'),
                                        },
                                    )}
                                </Text>
                            ) : null}
                        </View>
                    </>
                ) : null}

                <Text style={styles.sectionTitle}>{t('Schedule')}</Text>
                <View style={styles.scheduleDaysSection}>
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
                                        {t(weekDayLabels[day]).slice(0, 2)}
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
                            value: t(
                                formatDuration(habit.estimatedDurationMinutes),
                            ),
                        },
                        {
                            label: 'Preferred time',
                            value: formatTime(habit.preferredTime, language),
                        },
                    ].map(detail => (
                        <View key={detail.label} style={styles.detailItem}>
                            <Text style={styles.detailLabel}>
                                {t(detail.label)}
                            </Text>
                            <Text style={styles.detailValue}>
                                {detail.value}
                            </Text>
                        </View>
                    ))}
                </View>

                {habit.seasonalStart || habit.seasonalEnd ? (
                    <View style={styles.seasonRow}>
                        <Text style={styles.detailLabel}>{t('Season')}</Text>
                        <Text style={styles.detailValue}>
                            {formatDate(habit.seasonalStart, language)}
                            {'  -  '}
                            {formatDate(habit.seasonalEnd, language)}
                        </Text>
                    </View>
                ) : null}

                <Text style={styles.sectionTitle}>{t('Progress')}</Text>
                <View style={styles.statsRow}>
                    {stats.map(stat => (
                        <View key={stat.label} style={styles.statItem}>
                            <Text style={styles.statValue}>{stat.value}</Text>
                            <Text style={styles.statLabel}>
                                {t(stat.label)}
                            </Text>
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
                        {t('Longest streak: {{count}} days', {
                            count: habit.longestStreak ?? 0,
                        })}
                    </Text>
                </View>

                <Text style={styles.sectionTitle}>{t('Recent activity')}</Text>
                {history.length ? (
                    <View style={styles.historyGrid}>
                        {history.slice(0, 14).map((record, index) => (
                            <View
                                key={`${record.date.toISOString()}-${index}`}
                                style={[
                                    styles.historyItem,
                                    {
                                        backgroundColor: `${getStatusColor(
                                            record.status,
                                        )}1A`,
                                    },
                                ]}
                            >
                                <Text style={styles.historyDate}>
                                    {formatDate(record.date, language)}
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
                                    {t(
                                        getHabitStatusPresentation(
                                            record.status,
                                        ).label,
                                    )}
                                </Text>
                                {record.completionTime ? (
                                    <Text style={styles.historyDetail}>
                                        {formatTime(
                                            record.completionTime,
                                            language,
                                        )}
                                    </Text>
                                ) : null}
                                {record.incompletionReason ? (
                                    <Text style={styles.historyDetail}>
                                        {t('Reason: {{reason}}', {
                                            reason: record.incompletionReason,
                                        })}
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
                        {t('No activity recorded yet.')}
                    </Text>
                )}

                {latestNote ? (
                    <View style={styles.noteBox}>
                        <Text style={styles.detailLabel}>
                            {t('Latest note')}
                        </Text>
                        <Text style={styles.noteText}>{latestNote}</Text>
                    </View>
                ) : null}

                {habit.createdAt ? (
                    <Text style={styles.createdText}>
                        {t('Created {{date}}', {
                            date: formatDate(habit.createdAt, language),
                        })}
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
        marginBottom: 10,
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
    logProgressButton: { marginTop: 12 },
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
        marginTop: 10,
    },
    priorityText: {
        fontFamily: typography.fontFamily,
        fontSize: 14,
        fontWeight: '600',
        marginTop: 8,
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
