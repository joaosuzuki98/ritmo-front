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
import { StarMoonAnimation } from './components/StarMoonAnimation'
import { useAskTheStarsViewModel } from './useAskTheStarsViewModel'
import { useAnalysisLoading } from './useAnalysisLoading'

type AskTheStarsScreenProps = {
    currentUser: User
    initialHabitId?: string
    isWeeklyLoadAnalysis?: boolean
    onClose: () => void
    onMenuPress: () => void
    onScheduleAccepted: (weekDay: WeekDay) => void
    totalAccessDays: number
}

const formatTime = (date: Date) =>
    date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
    })

const formatDays = (days: readonly number[]) =>
    days.map(day => weekDayLabels[day as keyof typeof weekDayLabels]).join(', ')

export const AskTheStarsScreen = ({
    currentUser,
    initialHabitId,
    isWeeklyLoadAnalysis = false,
    onClose,
    onMenuPress,
    onScheduleAccepted,
    totalAccessDays,
}: AskTheStarsScreenProps) => {
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
                return 'Coming soon! Ask the stars for guidance with your habits.'
            if (!weeklyLoadAnalysis)
                return 'I’m reviewing your weekly routine and completion history.'
            if (weeklyLoadAnalysis.kind === 'insufficient')
                return `I need at least 5 active habits and 10 planned sessions per week, with enough history across three full weeks, before I can recommend changing your total load. You currently have ${weeklyLoadAnalysis.activeHabitCount} active habits and ${weeklyLoadAnalysis.occurrenceCount} planned sessions in the last full week.`
            if (weeklyLoadAnalysis.kind === 'balanced')
                return 'Your weekly completion is mixed, so I recommend keeping your current routine steady and checking again after a little more tracking.'
            if (weeklyLoadAnalysis.kind === 'reduce')
                return `Your completion rate across the last weeks is ${Math.round(
                    weeklyLoadAnalysis.completionRate * 100,
                )}%. A lighter routine may be more sustainable. Here are up to three habits with the lowest completion for you to review; nothing will change unless you decide to change it.`
            return `You completed about ${Math.round(
                weeklyLoadAnalysis.completionRate * 100,
            )}% of planned sessions across the last weeks. Your consistency is high; these are the three lightest weekdays to consider if you decide to add a habit.`
        }
        if (!selectedHabit)
            return 'Choose a habit and I will look for a time that fits your routine.'
        if (!hasEnoughHistory)
            return `I need a little more history with ${selectedHabit.name} before I can find a reliable pattern. Keep tracking it and ask me again soon.`
        if (isLowSuccess)
            return selectedSuggestion
                ? `${selectedHabit.name} has a ${Math.round(
                      successRate * 100,
                  )}% success rate. Your stronger habits point to free alternative times below; choose one to keep the same weekly frequency.`
                : `${selectedHabit.name} has a ${Math.round(
                      successRate * 100,
                  )}% success rate, but I couldn't find a free alternative time that keeps the same weekly frequency.`
        if (successRate < 0.5)
            return `${selectedHabit.name} is completed ${Math.round(
                successRate * 100,
            )}% of the time. There is room to build a steadier routine; keep tracking your progress.`
        if (successRate < 0.75)
            return `${selectedHabit.name} is completed ${Math.round(
                successRate * 100,
            )}% of the time. You're making progress—small, consistent steps can help strengthen this habit.`

        return `${selectedHabit.name} is completed ${Math.round(
            successRate * 100,
        )}% of the time. That's strong consistency; keep up the great work!`
    }

    const starMessage = getStarMessage()

    const handleAccept = async () => {
        if (!selectedSuggestion || isSaving || shouldShowAnalysisLoading) return
        if (await acceptSuggestion(selectedSuggestion))
            onScheduleAccepted(clampWeekDay(selectedSuggestion.days[0] ?? 1))
    }

    const renderSuggestion = (
        suggestion: HabitScheduleSuggestion,
        index: number,
    ) => {
        const isSelected = selectedSuggestionIndex === index

        return (
            <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                key={`${suggestion.days.join(
                    '-',
                )}-${suggestion.time.getHours()}`}
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
                    {formatDays(suggestion.days)}
                </Text>
                <Text style={styles.suggestionTime}>
                    {formatTime(suggestion.time)}
                </Text>
                <Text style={styles.suggestionEvidence}>
                    {Math.round(suggestion.successRate * 100)}% success across{' '}
                    {suggestion.sampleCount} similar scheduled occurrences
                </Text>
            </Pressable>
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
                accessibilityLabel="Back to previous screen"
                accessibilityRole="button"
                hitSlop={spacing.sm}
                onPress={onClose}
                style={styles.backButton}
            >
                <Text style={styles.backText}>Back</Text>
            </Pressable>

            <ScrollView
                ref={scrollRef}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                style={styles.scrollView}
            >
                <Text
                    style={[
                        styles.title,
                        { fontSize: Math.min(64 * scale, width * 0.12) },
                    ]}
                >
                    Ask the Stars
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
                        accessibilityLabel="Loading habit analysis"
                        accessibilityState={{ busy: true }}
                        className="mb-4 items-center gap-2"
                    >
                        <Text
                            style={{
                                color: colors.onboardingPurple,
                                fontFamily: typography.fontFamily,
                            }}
                        >
                            Reading your habit history…
                        </Text>
                    </View>
                ) : null}
                {canShowStarMessage ? (
                    <AnimatedStarMessage
                        key={starMessage}
                        message={starMessage}
                    />
                ) : null}

                {isAnalysisFlow ? (
                    <Pressable
                        accessibilityLabel={
                            selectedHabit
                                ? `Selected habit: ${selectedHabit.name}. Choose another habit`
                                : 'Choose a habit to analyze'
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
                            {selectedHabit?.name ?? 'Choose a habit'}
                        </Text>
                    </Pressable>
                ) : null}

                {isAnalysisFlow &&
                !shouldShowAnalysisLoading &&
                isLowSuccess &&
                selectedAnalysis?.suggestions.length ? (
                    <View style={styles.suggestions}>
                        <Text style={styles.suggestionsHeading}>
                            {selectedAnalysis.suggestions.length > 1
                                ? 'Suggested schedules'
                                : 'Suggested schedule'}
                        </Text>
                        {selectedAnalysis.suggestions.map(renderSuggestion)}
                    </View>
                ) : null}

                {isWeeklyLoadFlow &&
                !isLoading &&
                !hasLoadError &&
                weeklyLoadAnalysis?.kind === 'reduce' ? (
                    <View style={styles.suggestions}>
                        <Text style={styles.suggestionsHeading}>
                            Habits to review
                        </Text>
                        {weeklyLoadAnalysis.leastCompletedHabits.map(habit => (
                            <View key={habit.id} style={styles.suggestionCard}>
                                <Text style={styles.suggestionTitle}>
                                    {habit.name}
                                </Text>
                                <Text style={styles.suggestionEvidence}>
                                    {Math.round(habit.rate * 100)}% completed
                                    across {habit.occurrenceCount} planned
                                    sessions
                                </Text>
                            </View>
                        ))}
                    </View>
                ) : null}

                {isWeeklyLoadFlow &&
                !isLoading &&
                !hasLoadError &&
                weeklyLoadAnalysis?.kind === 'increase' ? (
                    <View style={styles.suggestions}>
                        <Text style={styles.suggestionsHeading}>
                            Lighter days to consider
                        </Text>
                        {weeklyLoadAnalysis.lighterDays.map(day => (
                            <View
                                key={day.weekDay}
                                style={styles.suggestionCard}
                            >
                                <Text style={styles.suggestionTitle}>
                                    {
                                        weekDayLabels[
                                            day.weekDay as keyof typeof weekDayLabels
                                        ]
                                    }
                                </Text>
                                <Text style={styles.suggestionEvidence}>
                                    {day.scheduledHabitCount} scheduled habits
                                    {day.estimatedMinutes
                                        ? ` · ${day.estimatedMinutes} estimated minutes`
                                        : ''}
                                    {day.eventCount
                                        ? ` · ${day.eventCount} calendar events`
                                        : ''}
                                </Text>
                            </View>
                        ))}
                    </View>
                ) : null}

                {isAnalysisFlow && errorMessage ? (
                    <Text style={styles.errorMessage}>{errorMessage}</Text>
                ) : null}
                {isWeeklyLoadFlow && hasLoadError ? (
                    <Text style={styles.errorMessage}>
                        Unable to load your weekly habit history.
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
                    {isLowSuccess ? (
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
                                {isSaving ? 'Saving…' : 'Accept schedule'}
                            </Text>
                        </Pressable>
                    ) : null}
                    <Pressable
                        accessibilityRole="button"
                        onPress={onClose}
                        style={styles.cancelButton}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </Pressable>
                </View>
            ) : (
                <View
                    style={[styles.composer, { bottom: spacing.md + bottom }]}
                >
                    <TextInput
                        accessibilityLabel="Ask your star, available in a future update"
                        accessibilityState={{ disabled: true }}
                        editable={false}
                        placeholder="Ask a question about your habits"
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
                closeAccessibilityLabel="Close habit selection"
                heightMode="max"
                heightRatio={0.5}
                isVisible={isAnalysisFlow && isHabitPickerVisible}
                onClose={() => setIsHabitPickerVisible(false)}
                title="Choose a habit"
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
                            No active habits are available to analyze yet.
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
