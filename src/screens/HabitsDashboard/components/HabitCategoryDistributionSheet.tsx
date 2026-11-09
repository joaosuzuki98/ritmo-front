import { useMemo } from 'react'
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native'

import { BottomSheetLayout } from '../../../components/BottomSheetLayout'
import { colors } from '../../../styles/colors'
import { getResponsiveScale } from '../../../styles/responsive'
import { spacing } from '../../../styles/spacing'
import { typography } from '../../../styles/typography'
import type { HabitCategoryViewData } from '../habitDashboard.types'
import { buildHabitCategoryDistribution } from '../habitCategoryDistribution'
import { useTranslation } from '../../../localization/useTranslation'

type HabitCategoryDistributionSheetProps = {
    habits: readonly HabitCategoryViewData[]
    isVisible: boolean
    onClose: () => void
}

const getHeatColor = (intensity: number) => {
    const red = Number.parseInt(colors.accentStrong.slice(1, 3), 16)
    const green = Number.parseInt(colors.accentStrong.slice(3, 5), 16)
    const blue = Number.parseInt(colors.accentStrong.slice(5, 7), 16)
    const alpha = 0.12 + intensity * 0.42
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

export const HabitCategoryDistributionSheet = ({
    habits,
    isVisible,
    onClose,
}: HabitCategoryDistributionSheetProps) => {
    const { width } = useWindowDimensions()
    const { t } = useTranslation()
    const scale = getResponsiveScale(width)
    const groups = useMemo(
        () => buildHabitCategoryDistribution(habits),
        [habits],
    )
    const largestGroup = groups[0]?.habits.length ?? 1

    return (
        <BottomSheetLayout
            closeAccessibilityLabel={t('Close category distribution')}
            headerStyle={{ marginBottom: spacing.md * scale }}
            isVisible={isVisible}
            onClose={onClose}
            title={t('Habit categories')}
            heightMode="fixed"
            heightRatio={0.76}
            shouldAvoidKeyboard={false}
        >
            <ScrollView
                contentContainerStyle={{ paddingBottom: spacing.lg * scale }}
                showsVerticalScrollIndicator={false}
            >
                {groups.length === 0 ? (
                    <Text
                        style={[
                            styles.emptyState,
                            { paddingVertical: spacing.lg * scale },
                        ]}
                    >
                        {t('No habits to group.')}
                    </Text>
                ) : (
                    groups.map(group => (
                        <View
                            key={group.label}
                            accessibilityLabel={`${group.label}, ${t(
                                '{{percentage}} percent, {{count}} habits',
                                {
                                    percentage: group.percentage,
                                    count: group.habits.length,
                                },
                            )}`}
                            style={[
                                styles.categoryCard,
                                {
                                    backgroundColor: getHeatColor(
                                        group.habits.length / largestGroup,
                                    ),
                                    borderColor: colors.border,
                                    borderRadius: 14 * scale,
                                    marginBottom: spacing.sm * scale,
                                    padding: spacing.md * scale,
                                },
                            ]}
                        >
                            <View className="flex-row items-center justify-between">
                                <View className="flex-1">
                                    <Text style={styles.categoryTitle}>
                                        {group.label}
                                    </Text>
                                    <Text
                                        style={{
                                            ...styles.habitCount,
                                            marginTop: spacing.xxs * scale,
                                        }}
                                    >
                                        {group.habits.length === 1
                                            ? t('habit')
                                            : t('habits')}
                                    </Text>
                                </View>
                                <Text style={styles.categoryPercentage}>
                                    {group.percentage}%
                                </Text>
                            </View>
                            <View
                                accessible
                                accessibilityLabel={t(
                                    '{{percentage}}% of habits',
                                    { percentage: group.percentage },
                                )}
                                accessibilityRole="progressbar"
                                accessibilityValue={{
                                    min: 0,
                                    max: 100,
                                    now: group.percentage,
                                }}
                                style={[
                                    styles.progressTrack,
                                    {
                                        backgroundColor: colors.border,
                                        borderRadius: 4 * scale,
                                        height: 7 * scale,
                                        marginTop: spacing.sm * scale,
                                    },
                                ]}
                            >
                                <View
                                    style={[
                                        styles.progressFill,
                                        {
                                            backgroundColor:
                                                colors.accentStrong,
                                            borderRadius: 4 * scale,
                                            width: `${group.percentage}%`,
                                        },
                                    ]}
                                />
                            </View>
                            <View style={{ marginTop: spacing.sm * scale }}>
                                {group.habits.map(habit => (
                                    <Text
                                        key={habit.id}
                                        style={styles.habitName}
                                    >
                                        · {habit.title}
                                    </Text>
                                ))}
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </BottomSheetLayout>
    )
}

const styles = StyleSheet.create({
    emptyState: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 14,
    },
    categoryCard: {
        borderWidth: 1,
    },
    categoryTitle: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 14,
        fontWeight: '600',
    },
    habitCount: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 13,
    },
    categoryPercentage: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 16,
        fontWeight: '700',
    },
    habitName: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 14,
        lineHeight: 21,
    },
    progressTrack: {
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
    },
})
