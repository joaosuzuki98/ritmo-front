import { useEffect, useRef, useState } from 'react'
import type { ComponentRef } from 'react'
import { ArrowUp } from 'phosphor-react-native'
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useIsFocused } from '@react-navigation/native'

import { BottomSheetLayout } from '../../components/BottomSheetLayout'
import type { User } from '../../database'
import { StarBackground } from '../../components/StarBackground/StarBackground'
import { TopBar } from '../../components/TopBar/TopBar'
import {
    clampWeekDay,
    weekDayLabels,
    type WeekDay,
} from '../../constants/weekDays'
import type { HabitScheduleSuggestion } from '../../habits/habitScheduleAnalysis'
import { colors } from '../../styles/colors'
import { getResponsiveScale } from '../../styles/responsive'
import { spacing } from '../../styles/spacing'
import { typography } from '../../styles/typography'
import { AnimatedStarMessage } from './components/AnimatedStarMessage'
import { AnimatedSuggestionCard } from './components/AnimatedSuggestionCard'
import { StarMoonAnimation } from './components/StarMoonAnimation'
import { useAskTheStarsViewModel } from './useAskTheStarsViewModel'
import { useAnalysisLoading } from './useAnalysisLoading'
import { useTranslation } from '../../localization/useTranslation'

type AskTheStarsScreenProps = {
    currentUser: User
    initialHabitId?: string
    isWeeklyLoadAnalysis?: boolean
    onClose: () => void
    onMenuPress: () => void
    onScheduleAccepted: (weekDay: WeekDay) => void
    totalAccessDays: number
}

const formatTime = (date: Date, language: 'en' | 'pt') =>
    date.toLocaleTimeString(language === 'pt' ? 'pt-BR' : 'en-US', {
        hour: 'numeric',
        minute: '2-digit',
    })

const formatDays = (
    days: readonly number[],
    translate: (text: string) => string,
) =>
    days
        .map(day => translate(weekDayLabels[day as keyof typeof weekDayLabels]))
        .join(', ')

export const AskTheStarsScreen = ({
    currentUser,
    initialHabitId,
    isWeeklyLoadAnalysis = false,
    onClose,
    onMenuPress,
    onScheduleAccepted,
    totalAccessDays,
}: AskTheStarsScreenProps) => {
    const { language, t } = useTranslation()
    const { bottom } = useSafeAreaInsets()
    const { width } = useWindowDimensions()
    const scale = getResponsiveScale(width)
    const moonWidth = Math.min(width * 0.38, spacing.touchTarget * 5)
    const {
        acceptSuggestion,
        errorMessage,
        hasLoadError,
        isLoading,
        isSaving,
        selectableHabits,
        selectHabit,
        selectedAnalysis,
        selectedHabit,
        weeklyLoadAnalysis,
    } = useAskTheStarsViewModel(currentUser.id, initialHabitId)
    const [suggestionSelection, setSuggestionSelection] = useState<{
        habitId: string | undefined
        index: number
    }>({ habitId: undefined, index: 0 })
    const [isHabitPickerVisible, setIsHabitPickerVisible] = useState(false)
    const [completedMessageKey, setCompletedMessageKey] = useState<
        string | null
    >(null)
    const isFocused = useIsFocused()
    const isAnalysisFlow = Boolean(initialHabitId)
    const isWeeklyLoadFlow = isWeeklyLoadAnalysis && !isAnalysisFlow
    const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null)
    const shouldShowAnalysisLoading = useAnalysisLoading({
        habitId: isAnalysisFlow
            ? selectedHabit?.id ?? initialHabitId
            : undefined,
        isLoading,
        hasLoadError,
    })

    useEffect(() => {
        if (shouldShowAnalysisLoading)
            scrollRef.current?.scrollTo({ y: 0, animated: false })
    }, [shouldShowAnalysisLoading])

    const selectedSuggestionIndex =
        suggestionSelection.habitId === selectedAnalysis?.habitId &&
        suggestionSelection.index < (selectedAnalysis?.suggestions.length ?? 0)
            ? suggestionSelection.index
            : 0

    const selectedSuggestion: HabitScheduleSuggestion | undefined =
        selectedAnalysis?.suggestions[selectedSuggestionIndex]
    const isLowSuccess = selectedAnalysis?.isLowSuccess ?? false
    const hasEnoughHistory = selectedAnalysis?.hasEnoughHistory ?? false
    const successRate = selectedAnalysis?.successRate ?? 0
    const isWaitingForData = isAnalysisFlow
        ? shouldShowAnalysisLoading
        : isWeeklyLoadFlow && isLoading
    const canShowStarMessage = isAnalysisFlow
        ? !shouldShowAnalysisLoading && !hasLoadError
        : isWeeklyLoadFlow
        ? !isLoading && !hasLoadError
        : true

    const getStarMessage = () => {
        if (!isAnalysisFlow) {
            if (!isWeeklyLoadFlow)
                return t(
                    'Coming soon! Ask the stars for guidance with your habits.',
                )
            if (!weeklyLoadAnalysis)
                return t(
                    'I’m reviewing your weekly routine and completion history.',
                )
            if (weeklyLoadAnalysis.kind === 'insufficient')
                return t(
                    'I need at least 5 active habits and 10 planned sessions per week, with enough history across three full weeks, before I can recommend changing your total load. You currently have {{activeHabitCount}} active habits and {{occurrenceCount}} planned sessions in the last full week.',
                    {
                        activeHabitCount: weeklyLoadAnalysis.activeHabitCount,
                        occurrenceCount: weeklyLoadAnalysis.occurrenceCount,
                    },
                )
            if (weeklyLoadAnalysis.kind === 'balanced')
                return t(
                    'Your weekly completion is mixed, so I recommend keeping your current routine steady and checking again after a little more tracking.',
                )
            if (weeklyLoadAnalysis.kind === 'reduce')
                return t(
                    'Your completion rate across the last weeks is {{completionRate}}%. A lighter routine may be more sustainable. Here are up to three habits with the lowest completion for you to review; nothing will change unless you decide to change it.',
                    {
                        completionRate: Math.round(
                            weeklyLoadAnalysis.completionRate * 100,
                        ),
                    },
                )
            return t(
                'You completed about {{completionRate}}% of planned sessions across the last weeks. Your consistency is high; these are the three lightest weekdays to consider if you decide to add a habit.',
                {
                    completionRate: Math.round(
                        weeklyLoadAnalysis.completionRate * 100,
                    ),
                },
            )
        }
        if (!selectedHabit)
            return t(
                'Choose a habit and I will look for a time that fits your routine.',
            )
        if (!hasEnoughHistory)
            return t(
                'I need a little more history with {{habitName}} before I can find a reliable pattern. Keep tracking it and ask me again soon.',
                {
                    habitName: selectedHabit.name,
                },
            )
        if (isLowSuccess)
            return selectedSuggestion
                ? t(
                      '{{habitName}} has a {{successRate}}% success rate. Your stronger habits point to free alternative times below; choose one to keep the same weekly frequency.',
                      {
                          habitName: selectedHabit.name,
                          successRate: Math.round(successRate * 100),
                      },
                  )
                : t(
                      "{{habitName}} has a {{successRate}}% success rate, but I couldn't find a free alternative time that keeps the same weekly frequency.",
                      {
                          habitName: selectedHabit.name,
                          successRate: Math.round(successRate * 100),
                      },
                  )
        if (successRate < 0.5)
            return t(
                '{{habitName}} is completed {{successRate}}% of the time. There is room to build a steadier routine; keep tracking your progress.',
                {
                    habitName: selectedHabit.name,
                    successRate: Math.round(successRate * 100),
                },
            )
        if (successRate < 0.75)
            return t(
                "{{habitName}} is completed {{successRate}}% of the time. You're making progress—small, consistent steps can help strengthen this habit.",
                {
                    habitName: selectedHabit.name,
                    successRate: Math.round(successRate * 100),
                },
            )

        return t(
            "{{habitName}} is completed {{successRate}}% of the time. That's strong consistency; keep up the great work!",
            {
                habitName: selectedHabit.name,
                successRate: Math.round(successRate * 100),
            },
        )
    }

    const starMessage = getStarMessage()
    const messageKey = JSON.stringify([
        currentUser.id,
        isWeeklyLoadFlow,
        selectedHabit?.id ?? initialHabitId,
        starMessage,
    ])
    const canShowCards =
        isFocused && canShowStarMessage && completedMessageKey === messageKey

    useEffect(() => {
        if (!isFocused || !canShowStarMessage) setCompletedMessageKey(null)
    }, [isFocused, canShowStarMessage])

    const handleAccept = async () => {
        if (!selectedSuggestion || isSaving || !canShowCards) return
        if (await acceptSuggestion(selectedSuggestion))
            onScheduleAccepted(clampWeekDay(selectedSuggestion.days[0] ?? 1))
    }

    const renderSuggestion = (
        suggestion: HabitScheduleSuggestion,
        index: number,
    ) => {
        const isSelected = selectedSuggestionIndex === index

        return (
            <AnimatedSuggestionCard
                index={index}
                key={`${suggestion.days.join(
                    '-',
                )}-${suggestion.time.getHours()}`}
            >
                <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() =>
                        setSuggestionSelection({
                            habitId: selectedAnalysis?.habitId,
                            index,
                        })
                    }
                    style={[
                        styles.suggestionCard,
                        isSelected && styles.selectedSuggestionCard,
                    ]}
                >
                    <Text style={styles.suggestionTitle}>
                        {formatDays(suggestion.days, t)}
                    </Text>
                    <Text style={styles.suggestionTime}>
                        {formatTime(suggestion.time, language)}
                    </Text>
                    <Text style={styles.suggestionEvidence}>
                        {t(
                            '{{successRate}}% success across {{sampleCount}} similar scheduled occurrences',
                            {
                                successRate: Math.round(
                                    suggestion.successRate * 100,
                                ),
                                sampleCount: suggestion.sampleCount,
                            },
                        )}
                    </Text>
                </Pressable>
            </AnimatedSuggestionCard>
        )
    }

    return (
        <View style={styles.root}>
            <StarBackground />
            <TopBar
                onMenuPress={onMenuPress}
                onProfilePress={() => undefined}
                totalAccessDays={totalAccessDays}
                totalPoints={currentUser.totalPoints}
                userName={currentUser.name}
            />
            <Pressable
                accessibilityLabel={t('Back to previous screen')}
                accessibilityRole="button"
                hitSlop={spacing.sm}
                onPress={onClose}
                style={styles.backButton}
            >
                <Text style={styles.backText}>{t('Back')}</Text>
            </Pressable>

            <ScrollView
                ref={scrollRef}
                contentContainerStyle={[
                    styles.scrollContent,
                    isWeeklyLoadFlow && {
                        paddingBottom: bottom + spacing.xl,
                    },
                ]}
                showsVerticalScrollIndicator={false}
                style={styles.scrollView}
            >
                <Text
                    style={[
                        styles.title,
                        { fontSize: Math.min(64 * scale, width * 0.12) },
                    ]}
                >
                    {t('Ask the Stars')}
                </Text>

                <View style={styles.mascotArea}>
                    <View style={styles.mascotNameBadge}>
                        <Text numberOfLines={1} style={styles.mascotName}>
                            {currentUser.mascotName || currentUser.name}
                        </Text>
                    </View>
                    <StarMoonAnimation width={moonWidth} />
                </View>

                {isWaitingForData ? (
                    <View
                        accessibilityLabel={t('Loading habit analysis')}
                        accessibilityState={{ busy: true }}
                        className="mb-4 items-center gap-2"
                    >
                        <Text
                            style={{
                                color: colors.onboardingPurple,
                                fontFamily: typography.fontFamily,
                            }}
                        >
                            {t('Reading your habit history…')}
                        </Text>
                    </View>
                ) : null}
                {canShowStarMessage ? (
                    <AnimatedStarMessage
                        key={messageKey}
                        message={starMessage}
                        onAnimationStart={() => setCompletedMessageKey(null)}
                        onAnimationComplete={() =>
                            setCompletedMessageKey(messageKey)
                        }
                    />
                ) : null}

                {isAnalysisFlow ? (
                    <Pressable
                        accessibilityLabel={
                            selectedHabit
                                ? t(
                                      'Selected habit: {{habitName}}. Choose another habit',
                                      {
                                          habitName: selectedHabit.name,
                                      },
                                  )
                                : t('Choose a habit to analyze')
                        }
                        accessibilityRole="button"
                        disabled={shouldShowAnalysisLoading || hasLoadError}
                        onPress={() => setIsHabitPickerVisible(true)}
                        style={styles.selectedHabitButton}
                    >
                        <Text
                            numberOfLines={1}
                            style={styles.selectedHabitText}
                        >
                            {selectedHabit?.name ?? t('Choose a habit')}
                        </Text>
                    </Pressable>
                ) : null}

                {isAnalysisFlow &&
                canShowCards &&
                isLowSuccess &&
                selectedAnalysis?.suggestions.length ? (
                    <View style={styles.suggestions}>
                        <Text style={styles.suggestionsHeading}>
                            {selectedAnalysis.suggestions.length > 1
                                ? t('Suggested schedules')
                                : t('Suggested schedule')}
                        </Text>
                        {selectedAnalysis.suggestions.map(renderSuggestion)}
                    </View>
                ) : null}

                {isWeeklyLoadFlow &&
                canShowCards &&
                !isLoading &&
                !hasLoadError &&
                weeklyLoadAnalysis?.kind === 'reduce' ? (
                    <View style={styles.suggestions}>
                        <Text style={styles.suggestionsHeading}>
                            {t('Habits to review')}
                        </Text>
                        {weeklyLoadAnalysis.leastCompletedHabits.map(
                            (habit, index) => (
                                <AnimatedSuggestionCard
                                    key={habit.id}
                                    index={index}
                                >
                                    <View style={styles.suggestionCard}>
                                        <Text style={styles.suggestionTitle}>
                                            {habit.name}
                                        </Text>
                                        <Text style={styles.suggestionEvidence}>
                                            {t(
                                                '{{rate}}% completed across {{occurrenceCount}} planned sessions',
                                                {
                                                    rate: Math.round(
                                                        habit.rate * 100,
                                                    ),
                                                    occurrenceCount:
                                                        habit.occurrenceCount,
                                                },
                                            )}
                                        </Text>
                                    </View>
                                </AnimatedSuggestionCard>
                            ),
                        )}
                    </View>
                ) : null}

                {isWeeklyLoadFlow &&
                canShowCards &&
                !isLoading &&
                !hasLoadError &&
                weeklyLoadAnalysis?.kind === 'increase' ? (
                    <View style={styles.suggestions}>
                        <Text style={styles.suggestionsHeading}>
                            {t('Lighter days to consider')}
                        </Text>
                        {weeklyLoadAnalysis.lighterDays.map((day, index) => (
                            <AnimatedSuggestionCard
                                key={day.weekDay}
                                index={index}
                            >
                                <View style={styles.suggestionCard}>
                                    <Text style={styles.suggestionTitle}>
                                        {t(
                                            weekDayLabels[
                                                day.weekDay as keyof typeof weekDayLabels
                                            ],
                                        )}
                                    </Text>
                                    <Text style={styles.suggestionEvidence}>
                                        {t(
                                            '{{scheduledHabitCount}} scheduled habits',
                                            {
                                                scheduledHabitCount:
                                                    day.scheduledHabitCount,
                                            },
                                        )}
                                        {day.estimatedMinutes
                                            ? ` · ${t(
                                                  '{{estimatedMinutes}} estimated minutes',
                                                  {
                                                      estimatedMinutes:
                                                          day.estimatedMinutes,
                                                  },
                                              )}`
                                            : ''}
                                        {day.eventCount
                                            ? ` · ${t(
                                                  '{{eventCount}} calendar events',
                                                  {
                                                      eventCount:
                                                          day.eventCount,
                                                  },
                                              )}`
                                            : ''}
                                    </Text>
                                </View>
                            </AnimatedSuggestionCard>
                        ))}
                    </View>
                ) : null}

                {isAnalysisFlow && errorMessage ? (
                    <Text style={styles.errorMessage}>{t(errorMessage)}</Text>
                ) : null}
                {isWeeklyLoadFlow && hasLoadError ? (
                    <Text style={styles.errorMessage}>
                        {t('Unable to load your weekly habit history.')}
                    </Text>
                ) : null}
            </ScrollView>

            {isWeeklyLoadFlow ? null : isAnalysisFlow ? (
                <View
                    style={[
                        styles.analysisActions,
                        { marginBottom: spacing.md + bottom },
                    ]}
                >
                    {isLowSuccess && canShowCards ? (
                        <Pressable
                            accessibilityRole="button"
                            disabled={
                                !selectedSuggestion ||
                                isSaving ||
                                shouldShowAnalysisLoading
                            }
                            onPress={handleAccept}
                            style={[
                                styles.acceptButton,
                                (!selectedSuggestion ||
                                    isSaving ||
                                    shouldShowAnalysisLoading) &&
                                    styles.disabledButton,
                            ]}
                        >
                            <Text style={styles.acceptButtonText}>
                                {isSaving ? t('Saving…') : t('Accept schedule')}
                            </Text>
                        </Pressable>
                    ) : null}
                    <Pressable
                        accessibilityRole="button"
                        onPress={onClose}
                        style={styles.cancelButton}
                    >
                        <Text style={styles.cancelButtonText}>
                            {t('Cancel')}
                        </Text>
                    </Pressable>
                </View>
            ) : (
                <View
                    style={[styles.composer, { bottom: spacing.md + bottom }]}
                >
                    <TextInput
                        accessibilityLabel={t(
                            'Ask your star, available in a future update',
                        )}
                        accessibilityState={{ disabled: true }}
                        editable={false}
                        placeholder={t('Ask a question about your habits')}
                        placeholderTextColor={colors.onboardingMuted}
                        style={styles.composerInput}
                    />
                    <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ disabled: true }}
                        disabled
                        style={styles.composerButton}
                    >
                        <ArrowUp color={colors.white} size={32 * scale} />
                    </Pressable>
                </View>
            )}

            <BottomSheetLayout
                closeAccessibilityLabel={t('Close habit selection')}
                heightMode="max"
                heightRatio={0.5}
                isVisible={isAnalysisFlow && isHabitPickerVisible}
                onClose={() => setIsHabitPickerVisible(false)}
                title={t('Choose a habit')}
            >
                <ScrollView
                    contentContainerStyle={styles.habitOptions}
                    showsVerticalScrollIndicator={false}
                >
                    {selectableHabits.length ? (
                        selectableHabits.map(habit => {
                            const isSelected = habit.id === selectedHabit?.id
                            return (
                                <Pressable
                                    accessibilityRole="radio"
                                    accessibilityState={{
                                        selected: isSelected,
                                    }}
                                    key={habit.id}
                                    onPress={() => {
                                        selectHabit(habit.id)
                                        setIsHabitPickerVisible(false)
                                    }}
                                    style={[
                                        styles.habitOption,
                                        isSelected &&
                                            styles.selectedHabitOption,
                                    ]}
                                >
                                    <Text
                                        numberOfLines={1}
                                        style={[
                                            styles.habitOptionText,
                                            isSelected &&
                                                styles.selectedHabitOptionText,
                                        ]}
                                    >
                                        {habit.name}
                                    </Text>
                                </Pressable>
                            )
                        })
                    ) : (
                        <Text style={styles.emptyMessage}>
                            {t(
                                'No active habits are available to analyze yet.',
                            )}
                        </Text>
                    )}
                </ScrollView>
            </BottomSheetLayout>
        </View>
    )
}

const styles = StyleSheet.create({
    root: {
        backgroundColor: colors.onboardingBackground,
        flex: 1,
    },
    backButton: {
        justifyContent: 'center',
        minHeight: spacing.touchTarget,
        paddingHorizontal: spacing.lg,
    },
    backText: {
        color: colors.onboardingMuted,
        fontFamily:
            Platform.OS === 'android'
                ? typography.semiboldFontFamily
                : typography.fontFamily,
        fontSize: typography.caption.fontSize,
        fontWeight: '600',
    },
    scrollContent: {
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        paddingTop: spacing.xs,
    },
    scrollView: { flex: 1 },
    title: {
        color: colors.text,
        fontFamily:
            Platform.OS === 'android'
                ? 'mountains-of-christmas-regular'
                : 'Mountains of Christmas',
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    mascotArea: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
        minHeight: 190,
        width: '100%',
    },
    mascotNameBadge: {
        backgroundColor: colors.onboardingAction,
        borderRadius: spacing.xl,
        left: '58%',
        maxWidth: '40%',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xxs,
        position: 'absolute',
        top: spacing.xs,
        zIndex: 1,
    },
    mascotName: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 15,
    },
    selectedHabitButton: {
        alignItems: 'center',
        alignSelf: 'stretch',
        justifyContent: 'center',
        marginBottom: spacing.sm,
        minHeight: spacing.touchTarget,
    },
    selectedHabitText: {
        color: colors.onboardingPurple,
        fontFamily: typography.semiboldFontFamily,
        fontSize: 18,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    habitOptions: {
        gap: spacing.sm,
        paddingBottom: spacing.lg,
    },
    habitOption: {
        backgroundColor: colors.onboardingSurface,
        borderColor: colors.border,
        borderRadius: spacing.sm,
        borderWidth: 1,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
    },
    selectedHabitOption: {
        backgroundColor: colors.onboardingAction,
        borderColor: colors.onboardingAction,
    },
    habitOptionText: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 16,
    },
    selectedHabitOptionText: { color: colors.text },
    emptyMessage: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        marginVertical: spacing.md,
        textAlign: 'center',
    },
    suggestions: { alignSelf: 'stretch', marginTop: spacing.md },
    suggestionsHeading: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 17,
        fontWeight: '600',
        marginBottom: spacing.sm,
    },
    suggestionCard: {
        backgroundColor: colors.onboardingSurface,
        borderColor: colors.border,
        borderRadius: spacing.sm,
        borderWidth: 1,
        marginBottom: spacing.sm,
        padding: spacing.md,
    },
    selectedSuggestionCard: {
        borderColor: colors.onboardingPurple,
        borderWidth: 2,
    },
    suggestionTitle: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 16,
        fontWeight: '600',
    },
    suggestionTime: {
        color: colors.onboardingPurple,
        fontFamily: typography.fontFamily,
        fontSize: 23,
        marginTop: spacing.xxs,
    },
    suggestionEvidence: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 13,
        marginTop: spacing.xs,
    },
    errorMessage: {
        color: colors.danger,
        fontFamily: typography.fontFamily,
        marginVertical: spacing.sm,
    },
    analysisActions: {
        alignSelf: 'stretch',
        gap: spacing.sm,
        marginHorizontal: spacing.lg,
    },
    acceptButton: {
        alignItems: 'center',
        backgroundColor: colors.onboardingAction,
        borderRadius: spacing.sm,
        justifyContent: 'center',
        minHeight: spacing.touchTarget,
    },
    disabledButton: { opacity: 0.5 },
    acceptButtonText: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: spacing.touchTarget,
    },
    cancelButtonText: {
        color: colors.dayCount,
        fontFamily: typography.fontFamily,
        fontSize: 15,
    },
    composer: {
        backgroundColor: colors.onboardingSurface,
        borderRadius: spacing.md,
        flexDirection: 'row',
        height: 132,
        left: spacing.lg,
        padding: spacing.md,
        position: 'absolute',
        right: spacing.lg,
    },
    composerInput: {
        alignSelf: 'stretch',
        color: colors.textMuted,
        flex: 1,
        fontFamily: typography.fontFamily,
        fontSize: 16,
        padding: 0,
        textAlignVertical: 'top',
    },
    composerButton: {
        alignItems: 'center',
        alignSelf: 'flex-end',
        backgroundColor: colors.onboardingAction,
        borderRadius: spacing.xs,
        height: 32,
        justifyContent: 'center',
        width: 32,
    },
})
