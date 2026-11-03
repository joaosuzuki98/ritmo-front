import LottieView from 'lottie-react-native'
import { CheckFat, List } from 'phosphor-react-native'
import { useState } from 'react'
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { BottomSheetLayout } from '../../components/BottomSheetLayout'
import { StarBackground } from '../../components/StarBackground/StarBackground'
import type { User } from '../../database'
import { colors } from '../../styles/colors'
import { getResponsiveScale } from '../../styles/responsive'
import { spacing } from '../../styles/spacing'
import { typography } from '../../styles/typography'
import { useStartYourDayViewModel } from './useStartYourDayViewModel'

type StartYourDayScreenProps = {
    currentUser: User
    onMenuPress: () => void
}

const getDayNumber = (createdAt?: Date) => {
    if (!createdAt) return 1

    const today = new Date()
    const startOfToday = Date.UTC(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
    )
    const startOfCreation = Date.UTC(
        createdAt.getFullYear(),
        createdAt.getMonth(),
        createdAt.getDate(),
    )

    return Math.max(
        1,
        Math.floor((startOfToday - startOfCreation) / 86_400_000) + 1,
    )
}

export const StartYourDayScreen = ({
    currentUser,
    onMenuPress,
}: StartYourDayScreenProps) => {
    const { width, height } = useWindowDimensions()
    const { top, bottom } = useSafeAreaInsets()
    const scale = getResponsiveScale(width)
    const [isHabitSheetVisible, setIsHabitSheetVisible] = useState(false)
    const {
        groups,
        selectedIds,
        selectedGroups,
        status,
        pendingHabitIds,
        saveError,
        toggleHabit,
        retry,
    } = useStartYourDayViewModel(currentUser.id)
    // Match the reference's proportions while letting large text grow the flag.
    const sceneHeight = height - top - bottom
    const moonWidth = Math.min(width * 0.38, spacing.touchTarget * 5)
    const moonHeight = (moonWidth * 120) / 135

    return (
        <View style={styles.container}>
            <StarBackground />
            <View
                style={[styles.header, { top: top + spacing.xs }]}
                pointerEvents="box-none"
            >
                <Pressable
                    accessibilityLabel="Open menu"
                    accessibilityRole="button"
                    hitSlop={spacing.xs}
                    onPress={onMenuPress}
                    style={styles.menuButton}
                >
                    <List color={colors.text} size={30 * scale} />
                </Pressable>
            </View>

            <ScrollView
                contentContainerStyle={[
                    styles.content,
                    { minHeight: height, paddingTop: top },
                ]}
                showsVerticalScrollIndicator={false}
            >
                <View
                    style={[
                        styles.hero,
                        {
                            minHeight: sceneHeight * 0.41,
                            paddingTop: sceneHeight * 0.055,
                            paddingBottom: spacing.xl,
                        },
                    ]}
                >
                    <View
                        style={[styles.nameBadge, { top: sceneHeight * 0.025 }]}
                        testID="mascot-name-badge"
                    >
                        <Text numberOfLines={1} style={styles.nameText}>
                            {currentUser.mascotName || currentUser.name}
                        </Text>
                    </View>
                    <LottieView
                        autoPlay
                        loop
                        resizeMode="contain"
                        source={require('../../assets/animations/moon_idle_2.json')}
                        style={{ height: moonHeight, width: moonWidth }}
                        testID="start-your-day-moon"
                    />
                    <Text
                        style={[
                            styles.title,
                            {
                                fontSize:
                                    typography.screenTitle.fontSize * scale,
                                marginTop: sceneHeight * 0.065,
                            },
                        ]}
                    >
                        Start your day
                    </Text>
                    <Text style={styles.dayNumber}>
                        Day n° {getDayNumber(currentUser.createdAt)}
                    </Text>
                </View>

                <View
                    style={[
                        styles.focusArea,
                        {
                            minHeight: sceneHeight * 0.56,
                            paddingHorizontal: width * 0.045,
                            gap: width * 0.023,
                        },
                    ]}
                >
                    <View
                        accessible={false}
                        style={[styles.flagpole, { width: width * 0.023 }]}
                    />
                    <View
                        style={[
                            styles.focusCard,
                            {
                                marginTop: sceneHeight * 0.02,
                                minHeight: sceneHeight * 0.164,
                            },
                        ]}
                    >
                        <Text style={styles.focusTitle}>
                            {selectedGroups.length
                                ? 'Habits to focus today'
                                : 'Choose habits to focus today'}
                        </Text>
                        {selectedGroups.map(group => (
                            <Text
                                key={group.id}
                                style={styles.selectedHabits}
                                testID={`selected-habits-${group.id}`}
                            >
                                {group.labels.join(' - ')}
                            </Text>
                        ))}
                        {saveError ? (
                            <Text
                                accessibilityLiveRegion="polite"
                                style={styles.saveError}
                            >
                                {saveError}
                            </Text>
                        ) : null}
                        <Pressable
                            accessibilityRole="button"
                            onPress={() => setIsHabitSheetVisible(true)}
                            style={styles.addButton}
                            testID="open-habit-picker"
                        >
                            <Text style={styles.addText}>Add</Text>
                        </Pressable>
                    </View>
                </View>
                <View
                    accessible={false}
                    style={[
                        styles.grass,
                        { height: sceneHeight * 0.03 + bottom },
                    ]}
                />
            </ScrollView>

            <BottomSheetLayout
                closeAccessibilityLabel="Close add habits modal"
                heightMode="max"
                heightRatio={0.5}
                isVisible={isHabitSheetVisible}
                onClose={() => setIsHabitSheetVisible(false)}
                title="Add habits"
            >
                <ScrollView
                    contentContainerStyle={styles.habitOptions}
                    showsVerticalScrollIndicator={false}
                >
                    {status === 'loading' ? (
                        <Text style={styles.habitOptionText}>
                            Loading habits…
                        </Text>
                    ) : null}
                    {status === 'error' ? (
                        <View>
                            <Text
                                accessibilityLiveRegion="polite"
                                style={styles.habitOptionText}
                            >
                                Unable to load habits. Please try again.
                            </Text>
                            <Pressable
                                accessibilityRole="button"
                                onPress={retry}
                                style={styles.addButton}
                            >
                                <Text style={styles.addText}>Try again</Text>
                            </Pressable>
                        </View>
                    ) : null}
                    {status === 'success' && groups.length === 0 ? (
                        <Text style={styles.habitOptionText}>
                            Create a habit in Habits to choose your focus for
                            today.
                        </Text>
                    ) : null}
                    {groups.map(group => (
                        <View
                            key={group.id}
                            className="overflow-hidden rounded-xl"
                        >
                            {group.entries.map(habit => {
                                const isSelected = selectedIds.includes(
                                    habit.id,
                                )
                                const isSaving = pendingHabitIds.includes(
                                    habit.id,
                                )
                                return (
                                    <Pressable
                                        accessibilityLabel={habit.label}
                                        accessibilityHint={
                                            habit.parentLabel
                                                ? `Depends on ${habit.parentLabel}`
                                                : undefined
                                        }
                                        accessibilityRole="checkbox"
                                        accessibilityState={{
                                            checked: isSelected,
                                            disabled: isSaving,
                                        }}
                                        disabled={isSaving}
                                        key={habit.id}
                                        onPress={() => toggleHabit(habit.id)}
                                        style={[
                                            styles.habitOption,
                                            {
                                                paddingLeft:
                                                    spacing.md +
                                                    Math.min(habit.depth, 4) *
                                                        spacing.lg,
                                            },
                                            isSelected
                                                ? habit.depth > 0
                                                    ? styles.selectedChildOption
                                                    : styles.selectedHabitOption
                                                : null,
                                        ]}
                                        testID={`focus-habit-${habit.id}`}
                                    >
                                        <Text
                                            style={[
                                                styles.habitOptionText,
                                                isSelected
                                                    ? styles.selectedHabitOptionText
                                                    : null,
                                            ]}
                                        >
                                            {habit.depth > 0 ? (
                                                <Text
                                                    style={styles.habitBranch}
                                                    testID={`focus-habit-branch-${habit.id}`}
                                                >
                                                    {habit.isLastChild
                                                        ? '└── '
                                                        : '├── '}
                                                </Text>
                                            ) : null}
                                            {habit.label}
                                        </Text>
                                        {isSelected ? (
                                            <CheckFat
                                                color={colors.white}
                                                size={16}
                                                weight="bold"
                                            />
                                        ) : null}
                                    </Pressable>
                                )
                            })}
                        </View>
                    ))}
                </ScrollView>
            </BottomSheetLayout>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.onboardingBackground,
        flex: 1,
    },
    header: {
        position: 'absolute',
        zIndex: 1,
        left: spacing.md,
        alignItems: 'center',
        flexDirection: 'row',
    },
    menuButton: {
        alignItems: 'center',
        height: spacing.touchTarget,
        justifyContent: 'center',
        width: spacing.touchTarget,
    },
    nameBadge: {
        position: 'absolute',
        left: '64%',
        alignItems: 'center',
        backgroundColor: colors.onboardingAction,
        borderRadius: spacing.xl,
        maxWidth: '30%',
        justifyContent: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xxs,
    },
    nameText: {
        ...typography.caption,
        color: colors.text,
        fontFamily: typography.fontFamily,
    },
    content: {
        flexGrow: 1,
    },
    hero: {
        alignItems: 'center',
        paddingHorizontal: spacing.md,
    },
    title: {
        ...typography.screenTitle,
        color: colors.text,
        fontFamily: typography.fontFamily,
        textAlign: 'center',
    },
    dayNumber: {
        ...typography.screenSubtitle,
        color: colors.text,
        fontFamily: typography.fontFamily,
        marginTop: spacing.md,
    },
    focusArea: {
        flexGrow: 1,
        flexDirection: 'row',
    },
    flagpole: {
        backgroundColor: colors.white,
        borderTopLeftRadius: spacing.md,
        borderTopRightRadius: spacing.md,
        alignSelf: 'stretch',
    },
    grass: {
        backgroundColor: colors.startYourDayGrass,
        width: '100%',
    },
    focusCard: {
        backgroundColor: colors.onboardingSurface,
        borderRadius: spacing.sm,
        alignSelf: 'flex-start',
        flex: 1,
        paddingHorizontal: spacing.sm,
        paddingTop: spacing.md,
        paddingBottom: spacing.xs,
    },
    focusTitle: {
        ...typography.body,
        color: colors.text,
        fontFamily: typography.fontFamily,
        marginBottom: spacing.md,
    },
    selectedHabits: {
        ...typography.bodyStrong,
        color: colors.text,
        fontFamily: typography.fontFamily,
        marginBottom: spacing.sm,
    },
    addButton: {
        alignSelf: 'flex-start',
        justifyContent: 'center',
        marginTop: spacing.xs,
        minHeight: spacing.touchTarget,
        minWidth: spacing.touchTarget,
    },
    addText: {
        ...typography.body,
        color: colors.onboardingPurple,
        fontFamily: typography.fontFamily,
    },
    saveError: {
        ...typography.caption,
        color: colors.danger,
        fontFamily: typography.fontFamily,
        marginBottom: spacing.sm,
    },
    habitOptions: { gap: spacing.sm, paddingBottom: spacing.lg },
    habitOption: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        minHeight: spacing.touchTarget,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    selectedHabitOption: { backgroundColor: colors.accent },
    selectedChildOption: { backgroundColor: colors.onboardingPurple },
    habitBranch: {
        color: colors.white,
        fontFamily: typography.fontFamily,
        fontWeight: '700',
    },
    habitOptionText: {
        ...typography.body,
        color: colors.text,
        fontFamily: typography.fontFamily,
        flexShrink: 1,
    },
    selectedHabitOptionText: { fontWeight: typography.bodyStrong.fontWeight },
})
