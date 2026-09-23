import { X, Flame } from 'phosphor-react-native'
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native'

import { getHabitStatusPresentation } from '../../../constants/habitStatuses'
import { weekDayLabels, type WeekDay } from '../../../constants/weekDays'
import { colors } from '../../../styles/colors'
import { getResponsiveScale } from '../../../styles/responsive'
import { spacing } from '../../../styles/spacing'
import { typography } from '../../../styles/typography'
import type { HabitCardViewData } from '../habitDashboard.types'

type HabitDetailsModalProps = {
    habit: HabitCardViewData | null
    isVisible: boolean
    onClose: () => void
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
    return colors.textMuted
}

export const HabitDetailsModal = ({
    habit,
    isVisible,
    onClose,
}: HabitDetailsModalProps) => {
    const { height, width } = useWindowDimensions()
    const scale = getResponsiveScale(width)

    if (!habit) return null

    const history = habit.completionHistory ?? []
    const latestNote = history.find(record => record.note)?.note
    const hasDistractionLock = history.some(
        record => record.distractionLockEnabled,
    )
    const days = habit.weekDays
        .map(day => weekDayLabels[day as WeekDay])
        .filter(Boolean)
        .join(', ')
    const frequency =
        habit.frequencyType === 'weekly'
            ? 'Selected days'
            : habit.frequencyType === 'daily'
            ? 'Every day'
            : 'Not set'
    const stats = [
        { label: 'Completed', value: String(habit.completedCount ?? 0) },
        { label: 'Not done', value: String(habit.skippedCount ?? 0) },
        {
            label: 'Success rate',
            value: `${Math.round(habit.successRate ?? 0)}%`,
        },
        { label: 'Current streak', value: `${habit.currentStreak ?? 0} days` },
    ]

    return (
        <Modal
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent
            transparent
            visible={isVisible}
        >
            <View style={styles.overlay}>
                <Pressable
                    accessibilityLabel="Close habit details"
                    onPress={onClose}
                    style={styles.backdrop}
                />
                <View
                    style={[
                        styles.sheet,
                        {
                            height: Math.min(height * 0.9, 760 * scale),
                            paddingHorizontal: spacing.lg * scale,
                        },
                    ]}
                >
                    <View style={styles.header}>
                        <Text
                            style={[
                                styles.headerTitle,
                                { fontSize: 30 * scale },
                            ]}
                        >
                            Habit details
                        </Text>
                        <Pressable
                            accessibilityLabel="Close habit details"
                            accessibilityRole="button"
                            onPress={onClose}
                            style={styles.closeButton}
                        >
                            <X color={colors.text} size={30 * scale} />
                        </Pressable>
                    </View>

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

                        <View style={styles.badgesRow}>
                            <View
                                style={[
                                    styles.badge,
                                    { backgroundColor: habit.priorityColor },
                                ]}
                            >
                                <Text style={styles.badgeText}>
                                    {habit.priorityLabel} priority
                                </Text>
                            </View>
                            <View style={styles.statusBadge}>
                                <Text style={styles.statusBadgeText}>
                                    {habit.statusLabel}
                                </Text>
                            </View>
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

                        {habit.description ? (
                            <Text style={styles.description}>
                                {habit.description}
                            </Text>
                        ) : null}

                        <Text style={styles.sectionTitle}>Schedule</Text>
                        <View style={styles.detailGrid}>
                            {[
                                { label: 'Frequency', value: frequency },
                                { label: 'Days', value: days || 'Not set' },
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
                                <View
                                    key={detail.label}
                                    style={styles.detailItem}
                                >
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
                                    <Text style={styles.statValue}>
                                        {stat.value}
                                    </Text>
                                    <Text style={styles.statLabel}>
                                        {stat.label}
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
                                <Text style={styles.detailLabel}>
                                    Latest note
                                </Text>
                                <Text style={styles.noteText}>
                                    {latestNote}
                                </Text>
                            </View>
                        ) : null}

                        {habit.createdAt ? (
                            <Text style={styles.createdText}>
                                Created {formatDate(habit.createdAt)}
                            </Text>
                        ) : null}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        backgroundColor: 'rgba(0, 0, 0, 0.52)',
        bottom: 0,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,
    },
    sheet: {
        backgroundColor: colors.background,
        borderColor: colors.border,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderWidth: 1,
        paddingTop: 18,
    },
    header: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    headerTitle: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontWeight: '300',
    },
    closeButton: {
        alignItems: 'center',
        height: spacing.touchTarget,
        justifyContent: 'center',
        width: spacing.touchTarget,
    },
    titleBlock: {
        borderLeftWidth: 5,
        paddingLeft: 14,
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
        marginTop: 16,
    },
    badge: {
        borderRadius: 8,
        paddingHorizontal: 11,
        paddingVertical: 7,
    },
    badgeText: {
        color: colors.priorityText,
        fontFamily: typography.fontFamily,
        fontSize: 13,
        fontWeight: '600',
    },
    statusBadge: {
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.border,
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 11,
        paddingVertical: 7,
    },
    statusBadgeText: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 13,
    },
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
    sectionTitle: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 22,
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
        minWidth: '47%',
        paddingHorizontal: 13,
        paddingVertical: 11,
    },
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
        justifyContent: 'space-between',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
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
