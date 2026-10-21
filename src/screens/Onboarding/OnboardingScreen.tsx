import { useEffect, useRef, useState } from 'react'
import {
    Animated,
    Easing,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View,
    useWindowDimensions,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import Sound from 'react-native-sound'
import { SpeakerHigh, SpeakerSlash } from 'phosphor-react-native'

import { FormActionButton } from '../../components/FormActionButton'
import RitmoLogo from '../../assets/images/ritmo-logo.svg'
import Star from '../../assets/images/star.svg'
import { useFocusedInputScroll } from '../../hooks/useFocusedInputScroll'
import type { OnboardingIdentity } from '../../types/onboarding'
import { colors } from '../../styles/colors'
import { spacing } from '../../styles/spacing'
import { typography } from '../../styles/typography'
import { onboardingSchema } from './onboardingSchema'
import {
    getOnboardingAnimationHeight,
    OnboardingAnimation,
} from './components/OnboardingAnimation'
import { OnboardingProgress } from './components/OnboardingProgress'

type OnboardingScreenProps = {
    onComplete: (identity: OnboardingIdentity) => void
    onSignIn: () => void
}

type OnboardingPage = {
    page: 2 | 3 | 4 | 5 | 6 | 7
    description: string
    input?: 'mascotName' | 'name'
}

const onboardingPages: OnboardingPage[] = [
    {
        page: 2,
        description:
            "Hello, I'll be your assistant on this journey. What would you like to call me?",
        input: 'mascotName',
    },
    {
        page: 3,
        description: 'And what about you? What should I call you?',
        input: 'name',
    },
    {
        page: 4,
        description: 'Great! Now let me show you how Ritmo works.',
    },
    {
        page: 5,
        description:
            'Crie hábitos, organize-os em grupos, escolha os mais importantes como foco do dia e defina hábitos condicionais, liberados só depois de outro hábito ser concluído.',
    },
    {
        page: 6,
        description:
            'Monte seu dia em uma linha do tempo. Adicione hábitos e outros compromissos no mesmo cronograma e veja tudo em um só lugar.',
    },
    {
        page: 7,
        description:
            'E não é só sobre hábitos! Crie lembretes para datas importantes e tarefas para o que precisa ser feito. Isso e muito mais, tudo no mesmo lugar.',
    },
]

const onboardingPageTopRatios = {
    2: 0.3013,
    3: 0.3013,
    4: 0.3013,
    5: 0.3013,
    6: 0.3013,
    7: 0.3013,
} as const

const onboardingStars = [
    { left: 7, top: 13, size: 31, driftX: 3, driftY: 4, rotation: 3 },
    { left: 73, top: 4, size: 30, driftX: -4, driftY: 3, rotation: -2 },
    { left: 45, top: 12, size: 21, driftX: 2, driftY: -3, rotation: 2 },
    { left: 61, top: 29, size: 54, driftX: -3, driftY: 5, rotation: 2 },
    { left: 85, top: 36, size: 28, driftX: 4, driftY: -3, rotation: -3 },
    { left: 24, top: 43, size: 38, driftX: -4, driftY: 3, rotation: 3 },
    { left: 46, top: 52, size: 27, driftX: 3, driftY: -4, rotation: -2 },
    { left: 76, top: 56, size: 23, driftX: -3, driftY: 4, rotation: 2 },
    { left: 7, top: 73, size: 31, driftX: 3, driftY: -3, rotation: -2 },
    { left: 82, top: 76, size: 32, driftX: -4, driftY: 4, rotation: 3 },
    { left: 52, top: 86, size: 30, driftX: 2, driftY: -4, rotation: -2 },
    { left: 18, top: 92, size: 37, driftX: -3, driftY: 3, rotation: 2 },
] as const

const displayFontFamily =
    Platform.OS === 'android' ? 'quicksand' : typography.fontFamily
const bodyFontFamily =
    Platform.OS === 'android'
        ? 'quattrocento-sans'
        : typography.onboardingFontFamily

export const OnboardingScreen = ({
    onComplete,
    onSignIn,
}: OnboardingScreenProps) => {
    const [currentPage, setCurrentPage] = useState(1)
    const [mascotName, setMascotName] = useState('')
    const [name, setName] = useState('')
    const [mascotNameError, setMascotNameError] = useState('')
    const [nameError, setNameError] = useState('')
    const [isAudioMuted, setIsAudioMuted] = useState(false)
    const soundtrackRef = useRef<Sound | null>(null)
    const isAudioMutedRef = useRef(false)
    const starDrift = useRef(new Animated.Value(0)).current
    const pageTransition = useRef(new Animated.Value(1)).current
    const { height, width } = useWindowDimensions()
    const { top: safeAreaTop } = useSafeAreaInsets()
    const {
        scrollRef,
        ensureFocusedInputVisible,
        handleScroll,
        isKeyboardVisible,
    } = useFocusedInputScroll()
    const isMascotKeyboardVisible = currentPage === 2 && isKeyboardVisible
    const isEntryPage = currentPage === 1
    const page = isEntryPage ? undefined : onboardingPages[currentPage - 2]
    // Align the copy with page 4 while preserving each illustration's aspect ratio.
    const illustrationOffset =
        currentPage >= 5
            ? getOnboardingAnimationHeight(4, width) -
              getOnboardingAnimationHeight(currentPage, width)
            : 0
    const pageContentOffset = isEntryPage
        ? 0
        : height *
              onboardingPageTopRatios[
                  currentPage as keyof typeof onboardingPageTopRatios
              ] -
          safeAreaTop -
          spacing.touchTarget +
          illustrationOffset
    const pageContentPosition =
        pageContentOffset < 0
            ? { marginTop: pageContentOffset }
            : { paddingTop: pageContentOffset }
    const pageDescriptionGap = isMascotKeyboardVisible
        ? spacing.xs
        : currentPage === 2
        ? 52
        : 30
    const inputGap = isMascotKeyboardVisible
        ? spacing.xs
        : currentPage === 3
        ? 68
        : 28

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(starDrift, {
                    toValue: 1,
                    duration: 18000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(starDrift, {
                    toValue: 0,
                    duration: 18000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ]),
        )

        animation.start()
        return () => animation.stop()
    }, [starDrift])

    useEffect(() => {
        let isActive = true
        Sound.setCategory('Playback')
        const soundtrack = new Sound(
            'onboarding_track.mp3',
            Sound.MAIN_BUNDLE,
            error => {
                const loadedSoundtrack = soundtrackRef.current
                if (!isActive || !loadedSoundtrack) return
                if (error) {
                    loadedSoundtrack.release()
                    soundtrackRef.current = null
                    return
                }

                loadedSoundtrack.setNumberOfLoops(-1)
                loadedSoundtrack.setVolume(isAudioMutedRef.current ? 0 : 1)
                loadedSoundtrack.play()
            },
        )
        soundtrackRef.current = soundtrack

        return () => {
            isActive = false
            soundtrack.stop()
            soundtrack.release()
            soundtrackRef.current = null
        }
    }, [])

    useEffect(() => {
        Keyboard.dismiss()
        scrollRef.current?.scrollTo({ y: 0, animated: false })
        pageTransition.setValue(0)
        const animation = Animated.timing(pageTransition, {
            toValue: 1,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        })
        animation.start()
        return () => animation.stop()
    }, [currentPage, pageTransition, scrollRef])

    const handleContinue = () => {
        if (isEntryPage) {
            setCurrentPage(2)
            return
        }

        if (currentPage === 2) {
            const result =
                onboardingSchema.shape.mascotName.safeParse(mascotName)
            if (!result.success) {
                setMascotNameError(result.error.issues[0]?.message ?? '')
                return
            }
            setMascotName(result.data)
            setMascotNameError('')
            setCurrentPage(3)
            return
        }

        if (currentPage === 3) {
            const result = onboardingSchema.shape.name.safeParse(name)
            if (!result.success) {
                setNameError(result.error.issues[0]?.message ?? '')
                return
            }
            setName(result.data)
            setNameError('')
            setCurrentPage(4)
            return
        }

        if (currentPage === 7) {
            const result = onboardingSchema.safeParse({ name, mascotName })
            if (!result.success) {
                setCurrentPage(
                    result.error.issues[0]?.path[0] === 'mascotName' ? 2 : 3,
                )
                return
            }
            onComplete(result.data)
            return
        }

        setCurrentPage(currentPage + 1)
    }

    const handleBack = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1)
    }

    const handleToggleAudio = () => {
        const nextIsMuted = !isAudioMutedRef.current
        isAudioMutedRef.current = nextIsMuted
        setIsAudioMuted(nextIsMuted)
        soundtrackRef.current?.setVolume(nextIsMuted ? 0 : 1)
    }

    const renderStarField = () => (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {onboardingStars.map(star => (
                <Animated.View
                    key={`${star.left}-${star.top}`}
                    style={[
                        styles.star,
                        {
                            height: star.size,
                            left: `${star.left}%`,
                            top: `${star.top}%`,
                            width: star.size,
                        },
                        {
                            transform: [
                                {
                                    translateX: starDrift.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [
                                            -star.driftX,
                                            star.driftX,
                                        ],
                                    }),
                                },
                                {
                                    translateY: starDrift.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [
                                            star.driftY,
                                            -star.driftY,
                                        ],
                                    }),
                                },
                                {
                                    rotate: starDrift.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [
                                            `${-star.rotation}deg`,
                                            `${star.rotation}deg`,
                                        ],
                                    }),
                                },
                            ],
                        },
                    ]}
                >
                    <Star height="100%" width="100%" />
                </Animated.View>
            ))}
        </View>
    )

    const logoWidth = Math.min(width * 0.52, 300)

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />
            {renderStarField()}
            <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <View style={styles.screen}>
                        <View style={styles.topBar}>
                            {isEntryPage ? (
                                <View style={styles.topBarSpacer} />
                            ) : (
                                <Pressable
                                    accessibilityLabel="Back to previous onboarding page"
                                    accessibilityRole="button"
                                    hitSlop={spacing.sm}
                                    onPress={handleBack}
                                    style={({ pressed }) => [
                                        styles.backButton,
                                        pressed && styles.pressed,
                                    ]}
                                >
                                    <Text style={styles.backText}>Back</Text>
                                </Pressable>
                            )}
                            <Pressable
                                accessibilityLabel={
                                    isAudioMuted
                                        ? 'Ativar áudio da apresentação'
                                        : 'Silenciar áudio da apresentação'
                                }
                                accessibilityRole="button"
                                accessibilityState={{ selected: isAudioMuted }}
                                hitSlop={spacing.sm}
                                onPress={handleToggleAudio}
                                style={({ pressed }) =>
                                    pressed && styles.pressed
                                }
                            >
                                {isAudioMuted ? (
                                    <SpeakerSlash
                                        color={colors.onboardingMuted}
                                        size={20}
                                        weight="regular"
                                    />
                                ) : (
                                    <SpeakerHigh
                                        color={colors.onboardingMuted}
                                        size={20}
                                        weight="regular"
                                    />
                                )}
                            </Pressable>
                        </View>

                        <ScrollView
                            ref={scrollRef}
                            bounces={false}
                            contentContainerStyle={[
                                styles.contentContainer,
                                isEntryPage
                                    ? styles.entryContentContainer
                                    : undefined,
                            ]}
                            keyboardDismissMode="on-drag"
                            keyboardShouldPersistTaps="handled"
                            onContentSizeChange={ensureFocusedInputVisible}
                            onFocus={ensureFocusedInputVisible}
                            onLayout={ensureFocusedInputVisible}
                            onScroll={handleScroll}
                            scrollEventThrottle={16}
                            showsVerticalScrollIndicator={false}
                            style={styles.content}
                        >
                            <Animated.View
                                testID="onboarding-page-transition"
                                style={{
                                    opacity: pageTransition,
                                    transform: [
                                        {
                                            translateX:
                                                pageTransition.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [12, 0],
                                                }),
                                        },
                                    ],
                                }}
                            >
                                {isEntryPage ? (
                                    <View style={styles.entryContent}>
                                        <RitmoLogo
                                            height={(logoWidth * 52) / 228}
                                            width={logoWidth}
                                        />
                                        <Text
                                            accessibilityLabel="Onboarding welcome"
                                            style={styles.entrySubtitle}
                                        >
                                            Bem-vindo(a)
                                        </Text>
                                        <Text style={styles.entryDescription}>
                                            Crie novos hábitos, monte
                                            cronogramas, defina lembretes e
                                            organize suas tarefas em um único
                                            lugar, tudo em um ambiente pensado
                                            para trazer calma ao seu dia a dia.
                                        </Text>
                                    </View>
                                ) : (
                                    <View
                                        accessibilityLabel={`Onboarding page ${currentPage} of 7`}
                                        style={[
                                            styles.pageContent,
                                            pageContentPosition,
                                        ]}
                                    >
                                        <OnboardingAnimation
                                            page={currentPage}
                                        />
                                        <Text
                                            accessibilityLabel={`Onboarding copy page ${currentPage}`}
                                            accessibilityRole="header"
                                            style={[
                                                styles.pageDescription,
                                                {
                                                    marginTop:
                                                        pageDescriptionGap,
                                                },
                                            ]}
                                        >
                                            {page?.description}
                                        </Text>
                                        {page?.input ? (
                                            <View
                                                style={[
                                                    styles.inputGroup,
                                                    { marginTop: inputGap },
                                                ]}
                                            >
                                                <TextInput
                                                    accessibilityLabel={
                                                        page.input ===
                                                        'mascotName'
                                                            ? 'Mascot name'
                                                            : 'Your name'
                                                    }
                                                    autoCapitalize="words"
                                                    autoCorrect={false}
                                                    onChangeText={value => {
                                                        if (
                                                            page.input ===
                                                            'mascotName'
                                                        ) {
                                                            setMascotName(value)
                                                            setMascotNameError(
                                                                '',
                                                            )
                                                        } else {
                                                            setName(value)
                                                            setNameError('')
                                                        }
                                                    }}
                                                    placeholder={
                                                        page.input ===
                                                        'mascotName'
                                                            ? 'My name'
                                                            : 'Your name'
                                                    }
                                                    placeholderTextColor={
                                                        colors.textMuted
                                                    }
                                                    returnKeyType="done"
                                                    style={styles.input}
                                                    underlineColorAndroid="transparent"
                                                    value={
                                                        page.input ===
                                                        'mascotName'
                                                            ? mascotName
                                                            : name
                                                    }
                                                />
                                                {page.input === 'mascotName' &&
                                                mascotNameError ? (
                                                    <Text
                                                        accessibilityLabel="Mascot name error"
                                                        accessibilityLiveRegion="polite"
                                                        style={
                                                            styles.inputError
                                                        }
                                                    >
                                                        {mascotNameError}
                                                    </Text>
                                                ) : null}
                                                {page.input === 'name' &&
                                                nameError ? (
                                                    <Text
                                                        accessibilityLabel="Your name error"
                                                        accessibilityLiveRegion="polite"
                                                        style={
                                                            styles.inputError
                                                        }
                                                    >
                                                        {nameError}
                                                    </Text>
                                                ) : null}
                                            </View>
                                        ) : null}
                                    </View>
                                )}
                            </Animated.View>
                        </ScrollView>

                        <View style={styles.footer}>
                            {isEntryPage ? (
                                <FormActionButton
                                    accessibilityLabel="Continue onboarding"
                                    containerStyle={styles.continueButton}
                                    onPress={handleContinue}
                                    surfaceStyle={styles.continueButtonSurface}
                                    textStyle={styles.continueText}
                                    title="Get started"
                                />
                            ) : (
                                <Pressable
                                    accessibilityLabel={
                                        currentPage === 7
                                            ? 'Create account'
                                            : 'Next onboarding page'
                                    }
                                    accessibilityRole="button"
                                    onPress={handleContinue}
                                    style={({ pressed }) => [
                                        styles.nextButton,
                                        pressed && styles.pressed,
                                    ]}
                                >
                                    <Text style={styles.nextText}>
                                        {currentPage === 7
                                            ? 'Create account'
                                            : 'Next'}
                                    </Text>
                                </Pressable>
                            )}

                            {isEntryPage ? (
                                <View style={styles.signInPrompt}>
                                    <Text style={styles.signInPromptText}>
                                        Já tem uma conta?{' '}
                                        <Text
                                            accessibilityLabel="Sign in"
                                            accessibilityRole="link"
                                            onPress={onSignIn}
                                            style={styles.signInLink}
                                        >
                                            Entrar
                                        </Text>
                                    </Text>
                                </View>
                            ) : (
                                <View
                                    style={{
                                        marginTop: Math.max(
                                            spacing.xl,
                                            height * 0.075,
                                        ),
                                    }}
                                >
                                    <OnboardingProgress
                                        currentStep={currentPage - 1}
                                        onStepPress={step =>
                                            setCurrentPage(step + 1)
                                        }
                                    />
                                </View>
                            )}
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    )
}

const styles = StyleSheet.create({
    root: { backgroundColor: colors.onboardingBackground, flex: 1 },
    safeArea: { flex: 1 },
    keyboardView: { flex: 1 },
    screen: {
        alignSelf: 'center',
        flex: 1,
        maxWidth: 440,
        paddingHorizontal: spacing.md,
        width: '100%',
    },
    star: { position: 'absolute' },
    topBar: {
        alignItems: 'center',
        flexDirection: 'row',
        height: spacing.touchTarget,
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xs,
    },
    topBarSpacer: { height: spacing.touchTarget, width: spacing.touchTarget },
    backButton: { minHeight: spacing.touchTarget, justifyContent: 'center' },
    backText: {
        color: colors.onboardingMuted,
        fontFamily:
            Platform.OS === 'android'
                ? typography.semiboldFontFamily
                : displayFontFamily,
        fontSize: typography.caption.fontSize,
        fontWeight: '600',
    },
    content: { flex: 1, width: '100%' },
    contentContainer: { flexGrow: 1, width: '100%' },
    entryContentContainer: { justifyContent: 'center' },
    entryContent: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xs,
        paddingTop: 30,
        width: '100%',
    },
    entrySubtitle: {
        color: colors.white,
        fontFamily: bodyFontFamily,
        fontSize: 18,
        marginTop: spacing.xl,
        textAlign: 'center',
    },
    entryDescription: {
        color: colors.onboardingPurple,
        fontFamily: bodyFontFamily,
        fontSize: typography.onboardingBody.fontSize,
        lineHeight: typography.onboardingBody.lineHeight,
        marginTop: 54,
        textAlign: 'center',
        width: '100%',
    },
    pageContent: {
        alignItems: 'center',
        paddingBottom: spacing.lg,
        width: '100%',
    },
    pageDescription: {
        color: colors.onboardingPurple,
        fontFamily: bodyFontFamily,
        fontSize: typography.onboardingBody.fontSize,
        lineHeight: typography.onboardingBody.lineHeight,
        marginTop: spacing.lg,
        textAlign: 'center',
        width: '100%',
    },
    inputGroup: { alignSelf: 'center', maxWidth: 400, width: '100%' },
    input: {
        backgroundColor: 'transparent',
        borderBottomColor: colors.onboardingMuted,
        borderBottomWidth: 2,
        color: colors.white,
        fontFamily: displayFontFamily,
        fontSize: 16,
        minHeight: 48,
        paddingHorizontal: 0,
    },
    inputError: {
        color: colors.danger,
        fontFamily: bodyFontFamily,
        fontSize: 12,
        marginTop: spacing.xs,
    },
    footer: {
        alignItems: 'center',
        paddingBottom: spacing.lg,
        paddingTop: spacing.sm,
        width: '100%',
    },
    continueButton: {
        alignItems: 'center',
        alignSelf: 'stretch',
        justifyContent: 'center',
        width: '100%',
    },
    continueButtonSurface: {
        backgroundColor: colors.onboardingAction,
        borderRadius: 4,
        width: '100%',
    },
    continueText: {
        color: colors.mainLight,
        fontFamily:
            Platform.OS === 'android'
                ? typography.semiboldFontFamily
                : displayFontFamily,
        fontSize: 14,
        fontWeight: '600',
    },
    nextButton: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: spacing.touchTarget,
        paddingHorizontal: spacing.lg,
    },
    nextText: {
        color: colors.onboardingMuted,
        fontFamily:
            Platform.OS === 'android'
                ? typography.semiboldFontFamily
                : displayFontFamily,
        fontSize: 17,
        fontWeight: '600',
    },
    signInPrompt: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.xl,
    },
    signInPromptText: {
        color: colors.onboardingMuted,
        fontFamily: typography.fontFamily,
        fontSize: 13,
        lineHeight: 20,
        textAlign: 'center',
    },
    signInLink: {
        color: colors.white,
        fontWeight: '700',
    },
    pressed: { opacity: 0.7 },
})
