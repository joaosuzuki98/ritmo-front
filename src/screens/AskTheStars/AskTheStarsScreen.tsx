import { useEffect, useState } from 'react'
import LottieView from 'lottie-react-native'
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
import { useAskTheStarsViewModel } from './useAskTheStarsViewModel'

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
    const moonHeight = (moonWidth * 120) / 135
    const {
        acceptSuggestion,
        errorMessage,
        isSaving,
        selectableHabits,
        selectHabit,
        selectedAnalysis,
        selectedHabit,
    } = useAskTheStarsViewModel(currentUser.id, initialHabitId)
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0)
    const isAnalysisFlow = Boolean(initialHabitId)

    useEffect(() => {
        setSelectedSuggestionIndex(0)
    }, [selectedAnalysis?.habitId])

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
        if (!selectedSuggestion || isSaving) return
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
                onPress={() => setSelectedSuggestionIndex(index)}
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
                    <LottieView
                        autoPlay
                        loop
                        resizeMode="contain"
                        source={require('../../assets/animations/moon_idle.json')}
                        style={{ height: moonHeight, width: moonWidth }}
                    />
                </View>

                {isAnalysisFlow ? (
                    <Text style={styles.messageText}>{starMessage}</Text>
                ) : (
                    <AnimatedStarMessage message={starMessage} />
                )}

                {isAnalysisFlow && selectableHabits.length ? (
                    <ScrollView
                        horizontal
                        contentContainerStyle={styles.habitChoices}
                        showsHorizontalScrollIndicator={false}
                    >
                        {selectableHabits.map(habit => {
                            const isSelected = habit.id === selectedHabit?.id
                            return (
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityState={{
                                        selected: isSelected,
                                    }}
                                    key={habit.id}
                                    onPress={() => selectHabit(habit.id)}
                                    style={[
                                        styles.habitChip,
                                        isSelected && styles.selectedHabitChip,
                                    ]}
                                >
                                    <Text
                                        numberOfLines={1}
                                        style={[
                                            styles.habitChipText,
                                            isSelected &&
                                                styles.selectedHabitChipText,
                                        ]}
                                    >
                                        {habit.name}
                                    </Text>
                                </Pressable>
                            )
                        })}
                    </ScrollView>
                ) : isAnalysisFlow ? (
                    <Text style={styles.emptyMessage}>
                        No active habits are available to analyze yet.
                    </Text>
                ) : null}

                {isAnalysisFlow && selectedAnalysis?.suggestions.length ? (
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

                {isAnalysisFlow ? (
                    <View style={styles.actions}>
                        <Pressable
                            accessibilityRole="button"
                            disabled={!selectedSuggestion || isSaving}
                            onPress={handleAccept}
                            style={[
                                styles.acceptButton,
                                (!selectedSuggestion || isSaving) &&
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
                ) : null}
            </ScrollView>

            <View style={[styles.composer, { bottom: spacing.md + bottom }]}>
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
    messageText: {
        alignSelf: 'stretch',
        color: colors.onboardingPurple,
        marginBottom: spacing.md,
        fontFamily: typography.fontFamily,
        fontSize: typography.body.fontSize,
        lineHeight: typography.body.lineHeight,
        textAlign: 'center',
    },
    habitChoices: {
        alignItems: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.xs,
    },
    habitChip: {
        backgroundColor: colors.onboardingSurface,
        borderColor: colors.border,
        borderRadius: spacing.lg,
        borderWidth: 1,
        maxWidth: 190,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
    },
    selectedHabitChip: {
        backgroundColor: colors.onboardingAction,
        borderColor: colors.onboardingAction,
    },
    habitChipText: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 14,
    },
    selectedHabitChipText: { color: colors.text },
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
    actions: {
        alignSelf: 'stretch',
        gap: spacing.sm,
        marginTop: spacing.md,
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
        color: colors.textMuted,
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
