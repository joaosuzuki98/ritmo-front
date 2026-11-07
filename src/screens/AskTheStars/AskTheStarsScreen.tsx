import { useEffect, useRef, useState } from 'react'
import type { ComponentRef } from 'react'
import { ArrowUp } from 'phosphor-react-native'
import {
    ActivityIndicator,
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
import { weekDayLabels } from '../../constants/weekDays'
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
    onClose: () => void
    onMenuPress: () => void
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
    onClose,
    onMenuPress,
    totalAccessDays,
}: AskTheStarsScreenProps) => {
    const { bottom } = useSafeAreaInsets()
    const { height, width } = useWindowDimensions()
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
    } = useAskTheStarsViewModel(currentUser.id, initialHabitId)
    const [suggestionSelection, setSuggestionSelection] = useState<{
        habitId: string | undefined
        index: number
    }>({ habitId: undefined, index: 0 })
    const [isHabitPickerVisible, setIsHabitPickerVisible] = useState(false)
    const isAnalysisFlow = Boolean(initialHabitId)
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

    const getStarMessage = () => {
        if (!isAnalysisFlow)
            return 'Coming soon! Ask the stars for guidance with your habits.'
        if (!selectedHabit)
            return 'Choose a habit and I will look for a time that fits your routine.'
        if (!hasEnoughHistory)
            return `I need a little more history with ${selectedHabit.name} before I can find a reliable pattern. Keep tracking it and ask me again soon.`
        if (!selectedSuggestion)
            return isLowSuccess
                ? `I found that ${
                      selectedHabit.name
                  } is completed about ${Math.round(
                      (selectedAnalysis?.successRate ?? 0) * 100,
                  )}% of the time, but there is no conflict-free high-success slot that preserves its current weekly frequency.`
                : `I couldn't find a conflict-free time with enough history to recommend for ${selectedHabit.name}.`

        return isLowSuccess
            ? `${selectedHabit.name} has a ${Math.round(
                  (selectedAnalysis?.successRate ?? 0) * 100,
              )}% success rate across ${
                  selectedAnalysis?.occurrenceCount
              } scheduled days. Your habits with stronger completion history do best around ${formatTime(
                  selectedSuggestion.time,
              )}. This schedule is free and keeps the same weekly frequency.`
            : `Based on your history, ${formatTime(
                  selectedSuggestion.time,
              )} is a promising time for ${
                  selectedHabit.name
              }. This schedule is free and keeps the same weekly frequency.`
    }

    const starMessage = getStarMessage()

    const handleAccept = async () => {
        if (!selectedSuggestion || isSaving || shouldShowAnalysisLoading) return
        if (await acceptSuggestion(selectedSuggestion)) onClose()
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
                contentContainerStyle={[
                    styles.scrollContent,
                    {
                        minHeight: height - 100 * scale,
                        paddingBottom: 230 * scale + bottom,
                    },
                ]}
                showsVerticalScrollIndicator={false}
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

                {shouldShowAnalysisLoading ? (
                    <View
                        accessibilityLabel="Loading habit analysis"
                        accessibilityState={{ busy: true }}
                        className="mb-4 items-center gap-2"
                    >
                        <ActivityIndicator color={colors.onboardingPurple} />
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
                {!isAnalysisFlow ||
                (!shouldShowAnalysisLoading && !hasLoadError) ? (
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

                {isAnalysisFlow && errorMessage ? (
                    <Text style={styles.errorMessage}>{errorMessage}</Text>
                ) : null}
            </ScrollView>

            {isAnalysisFlow ? (
                <View
                    style={[
                        styles.analysisActions,
                        { bottom: spacing.md + bottom },
                    ]}
                >
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
        paddingTop: spacing.xs,
    },
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
        left: spacing.lg,
        position: 'absolute',
        right: spacing.lg,
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
        backgroundColor: colors.dayCount,
        borderRadius: spacing.sm,
        justifyContent: 'center',
        minHeight: spacing.touchTarget,
    },
    cancelButtonText: {
        color: colors.white,
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
