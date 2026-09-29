import { useEffect, useRef, useState } from 'react'
import {
    Animated,
    Easing,
    Image,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native'
import type { ImageSourcePropType } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Sound from 'react-native-sound'
import { SpeakerHigh, SpeakerSlash } from 'phosphor-react-native'

import RitmoLogo from '../../assets/images/ritmo-logo.svg'
import Star from '../../assets/images/star.svg'
import { colors } from '../../styles/colors'
import { spacing } from '../../styles/spacing'
import { typography } from '../../styles/typography'

type OnboardingScreenProps = {
    onComplete: () => void
}

type OnboardingPage = {
    title?: string
    description: string
    image?: ImageSourcePropType
    imageLabel?: string
}

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

const onboardingPages: OnboardingPage[] = [
    {
        title: 'Bem-vindo(a)',
        description:
            'O Ritmo App é o seu espaço aconchegante para construir hábitos e organizar a rotina. Com um visual relaxante e cozy, o app transforma produtividade em algo leve e prazeroso, sem a pressão ou a frieza dos apps tradicionais.',
    },
    {
        title: 'Bem-vindo(a)',
        description:
            'Crie novos hábitos, monte cronogramas, defina lembretes e organize suas tarefas em um único lugar, tudo em um ambiente pensado para trazer calma ao seu dia a dia. Porque construir uma rotinha melhor não precisa ser estressante, pode ser, literalmente, confortável.',
    },
    {
        title: 'Pequenos hábitos, grandes mudanças',
        description:
            'Acompanhe seus hábitos no dia a dia, registre cada conquista e veja sua consistência crescer com o tempo.',
        image: require('../../assets/images/onboarding-schedule.png'),
        imageLabel: 'Cartões coloridos com exemplos de tarefas e hábitos',
    },
    {
        title: 'Sua rotina em um só lugar',
        description:
            'Planeje o dia, visualize seus compromissos e conecte atividades aos hábitos que quer cultivar.',
        image: require('../../assets/images/onboarding-habits.png'),
        imageLabel: 'Exemplo de uma agenda com horários e atividades',
    },
    {
        description:
            'Para melhorar sua vida, você não precisa ser o mais rápido, apenas manter o seu ritmo.',
    },
] as const

const onboardingFontFamily =
    Platform.OS === 'android'
        ? 'quattrocento-sans'
        : typography.onboardingFontFamily

export const OnboardingScreen = ({ onComplete }: OnboardingScreenProps) => {
    const [currentPage, setCurrentPage] = useState(0)
    const [isAudioMuted, setIsAudioMuted] = useState(false)
    const drift = useRef(new Animated.Value(0)).current
    const soundtrackRef = useRef<Sound | null>(null)
    const isAudioMutedRef = useRef(false)
    const { height, width } = useWindowDimensions()
    const page = onboardingPages[currentPage]
    const isLastPage = currentPage === onboardingPages.length - 1
    const logoWidth = Math.min(width * 0.52, 300)
    const artworkWidth = Math.min(
        width * (currentPage === 3 ? 0.82 : 0.76),
        height * 0.37,
        380,
    )

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(drift, {
                    toValue: 1,
                    duration: 18000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(drift, {
                    toValue: 0,
                    duration: 18000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ]),
        )

        animation.start()

        return () => animation.stop()
    }, [drift])

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

    const handleContinue = () => {
        if (isLastPage) {
            onComplete()
            return
        }

        setCurrentPage(index => index + 1)
    }

    const handleToggleAudio = () => {
        const nextIsMuted = !isAudioMutedRef.current
        isAudioMutedRef.current = nextIsMuted
        setIsAudioMuted(nextIsMuted)
        soundtrackRef.current?.setVolume(nextIsMuted ? 0 : 1)
    }

    const renderStarField = () => (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {onboardingStars.map(star => {
                const animatedStyle = {
                    transform: [
                        {
                            translateX: drift.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-star.driftX, star.driftX],
                            }),
                        },
                        {
                            translateY: drift.interpolate({
                                inputRange: [0, 1],
                                outputRange: [star.driftY, -star.driftY],
                            }),
                        },
                        {
                            rotate: drift.interpolate({
                                inputRange: [0, 1],
                                outputRange: [
                                    `${-star.rotation}deg`,
                                    `${star.rotation}deg`,
                                ],
                            }),
                        },
                    ],
                }

                return (
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
                            animatedStyle,
                        ]}
                    >
                        <Star height="100%" width="100%" />
                    </Animated.View>
                )
            })}
        </View>
    )

    const renderLogo = () => (
        <RitmoLogo height={(logoWidth * 52) / 228} width={logoWidth} />
    )

    const renderPageContent = () => {
        if (currentPage === 0) {
            return (
                <View
                    style={[
                        styles.welcomeContent,
                        { transform: [{ translateY: height * 0.09 }] },
                    ]}
                >
                    {renderLogo()}
                    <Text style={styles.welcomeTitle}>{page.title}</Text>
                    <Text style={styles.welcomeDescription}>
                        {page.description}
                    </Text>
                </View>
            )
        }

        if (currentPage === 1) {
            return (
                <View style={styles.introContent}>
                    <View
                        style={[styles.introLogo, { marginTop: height * 0.22 }]}
                    >
                        {renderLogo()}
                        <Text style={styles.welcomeTitle}>{page.title}</Text>
                    </View>
                    <View style={styles.introCopy}>
                        <Text style={styles.introDescription}>
                            {page.description}
                        </Text>
                    </View>
                </View>
            )
        }

        if (currentPage === 2 || currentPage === 3) {
            return (
                <View style={styles.featureContent}>
                    {renderLogo()}
                    <Image
                        accessibilityLabel={page.imageLabel}
                        resizeMode="contain"
                        source={page.image}
                        style={[
                            styles.featureImage,
                            {
                                height: (artworkWidth * 427) / 440,
                                width: artworkWidth,
                            },
                        ]}
                    />
                    <Text style={styles.featureTitle}>{page.title}</Text>
                    <Text style={styles.featureDescription}>
                        {page.description}
                    </Text>
                </View>
            )
        }

        return (
            <View
                style={[
                    styles.finalContent,
                    { transform: [{ translateY: height * 0.08 }] },
                ]}
            >
                {renderLogo()}
                <Text style={styles.finalDescription}>{page.description}</Text>
            </View>
        )
    }

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />
            {renderStarField()}
            <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
                <View style={styles.screen}>
                    <View style={styles.topBar}>
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
                        {isLastPage ? (
                            <View style={styles.topBarSpacer} />
                        ) : (
                            <Pressable
                                accessibilityLabel="Pular apresentação"
                                accessibilityRole="button"
                                hitSlop={spacing.sm}
                                onPress={onComplete}
                            >
                                <Text style={styles.skipText}>Pular</Text>
                            </Pressable>
                        )}
                    </View>

                    <ScrollView
                        bounces={false}
                        contentContainerStyle={styles.contentContainer}
                        showsVerticalScrollIndicator={false}
                        style={styles.content}
                    >
                        {renderPageContent()}
                    </ScrollView>

                    <View style={styles.footer}>
                        <Pressable
                            accessibilityRole="button"
                            onPress={handleContinue}
                            style={({ pressed }) => [
                                styles.continueButton,
                                pressed && styles.pressed,
                            ]}
                        >
                            <Text style={styles.continueText}>
                                {isLastPage ? 'Iniciar' : 'Próximo'}
                            </Text>
                        </Pressable>

                        <View
                            style={[
                                styles.footerSpacer,
                                { height: height * 0.09 },
                            ]}
                        />

                        <View
                            accessibilityLabel={`Tela ${currentPage + 1} de ${
                                onboardingPages.length
                            }`}
                            accessibilityRole="progressbar"
                            style={styles.pagination}
                        >
                            {onboardingPages.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.paginationItem,
                                        index === currentPage &&
                                            styles.paginationItemActive,
                                    ]}
                                />
                            ))}
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    )
}

const styles = StyleSheet.create({
    root: { backgroundColor: colors.onboardingBackground, flex: 1 },
    safeArea: { flex: 1 },
    screen: {
        alignSelf: 'center',
        flex: 1,
        maxWidth: 500,
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
    topBarSpacer: { height: spacing.touchTarget },
    skipText: {
        color: colors.onboardingMuted,
        fontFamily: onboardingFontFamily,
        fontSize: typography.onboardingAction.fontSize,
        fontWeight: typography.onboardingAction.fontWeight,
    },
    content: {
        flex: 1,
        width: '100%',
    },
    contentContainer: {
        alignItems: 'center',
        flexGrow: 1,
        justifyContent: 'center',
        width: '100%',
    },
    welcomeContent: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    welcomeTitle: {
        color: colors.white,
        fontFamily: onboardingFontFamily,
        fontSize: typography.onboardingTitle.fontSize,
        lineHeight: typography.onboardingTitle.lineHeight,
        marginTop: spacing.md,
        textAlign: 'center',
    },
    welcomeDescription: {
        color: colors.onboardingPurple,
        fontFamily: onboardingFontFamily,
        fontSize: typography.onboardingBody.fontSize,
        lineHeight: typography.onboardingBody.lineHeight,
        marginTop: spacing.xl + spacing.sm,
        textAlign: 'center',
        width: '94%',
    },
    introContent: {
        alignItems: 'center',
        flex: 1,
        width: '100%',
    },
    introLogo: { alignItems: 'center' },
    introCopy: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: spacing.lg,
        width: '100%',
    },
    introDescription: {
        color: colors.onboardingPurple,
        fontFamily: onboardingFontFamily,
        fontSize: typography.onboardingBody.fontSize,
        lineHeight: typography.onboardingBody.lineHeight,
        textAlign: 'center',
        width: '100%',
    },
    featureContent: {
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: spacing.xs,
        width: '100%',
    },
    featureImage: { marginTop: spacing.xl },
    featureTitle: {
        color: colors.white,
        fontFamily: onboardingFontFamily,
        fontSize: typography.onboardingTitle.fontSize,
        lineHeight: typography.onboardingTitle.lineHeight,
        marginTop: spacing.xl,
        textAlign: 'center',
        width: '100%',
    },
    featureDescription: {
        color: colors.onboardingPurple,
        fontFamily: onboardingFontFamily,
        fontSize: typography.onboardingBody.fontSize,
        lineHeight: typography.onboardingBody.lineHeight,
        marginTop: spacing.xs,
        textAlign: 'center',
        width: '100%',
    },
    finalContent: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    finalDescription: {
        color: colors.onboardingPurple,
        fontFamily: onboardingFontFamily,
        fontSize: typography.onboardingBody.fontSize,
        lineHeight: typography.onboardingBody.lineHeight,
        marginTop: spacing.lg,
        textAlign: 'center',
        width: '100%',
    },
    footer: {
        alignItems: 'center',
        paddingBottom: spacing.xl + spacing.md,
    },
    continueButton: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: spacing.touchTarget,
    },
    footerSpacer: { flexShrink: 0 },
    continueText: {
        color: colors.onboardingMuted,
        fontFamily: onboardingFontFamily,
        fontSize: typography.onboardingAction.fontSize,
        fontWeight: typography.onboardingAction.fontWeight,
        textDecorationLine: 'underline',
    },
    pressed: { opacity: 0.7 },
    pagination: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: spacing.xs,
    },
    paginationItem: {
        backgroundColor: colors.onboardingMuted,
        borderRadius: spacing.sm,
        height: spacing.sm,
        width: spacing.xl,
    },
    paginationItemActive: {
        backgroundColor: colors.accent,
        width: spacing.xl + spacing.lg,
    },
})
