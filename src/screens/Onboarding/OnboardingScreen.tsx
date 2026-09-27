import { useState } from 'react'
import {
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
    Bell,
    CalendarBlank,
    CaretLeft,
    CheckCircle,
    Fire,
    Lightning,
    MusicNotes,
    Stack,
} from 'phosphor-react-native'

import { colors } from '../../styles/colors'
import { spacing } from '../../styles/spacing'
import { typography } from '../../styles/typography'

type OnboardingScreenProps = {
    onComplete: () => void
}

const onboardingPages = [
    {
        eyebrow: 'BEM-VINDA AO RITMO',
        title: 'Encontre o seu ritmo.',
        description:
            'Um espaço leve para cuidar dos hábitos, organizar compromissos e tirar planos do papel — um passo de cada vez.',
    },
    {
        eyebrow: 'CONSTÂNCIA SEM PRESSA',
        title: 'Pequenos hábitos, grandes mudanças.',
        description:
            'Acompanhe seus hábitos no dia a dia, registre cada conquista e veja sua consistência crescer com o tempo.',
    },
    {
        eyebrow: 'ORGANIZAÇÃO LEVE',
        title: 'Sua rotina em um só lugar.',
        description:
            'Planeje o dia, visualize seus compromissos e conecte atividades aos hábitos que quer cultivar.',
    },
    {
        eyebrow: 'NO MOMENTO CERTO',
        title: 'Lembretes que ajudam.',
        description:
            'Deixe eventos e datas importantes à vista para manter a cabeça tranquila e o dia fluindo.',
    },
    {
        eyebrow: 'SEUS PLANOS, EM MOVIMENTO',
        title: 'Faça acontecer no seu tempo.',
        description:
            'Transforme objetivos em tarefas simples, acompanhe o progresso e celebre cada etapa concluída.',
    },
] as const

export const OnboardingScreen = ({ onComplete }: OnboardingScreenProps) => {
    const [currentPage, setCurrentPage] = useState(0)
    const { height } = useWindowDimensions()
    const page = onboardingPages[currentPage]
    const isLastPage = currentPage === onboardingPages.length - 1

    const handleContinue = () => {
        if (isLastPage) {
            onComplete()
            return
        }

        setCurrentPage(index => index + 1)
    }

    const handlePrevious = () => {
        setCurrentPage(index => Math.max(0, index - 1))
    }

    const renderArtwork = () => {
        if (currentPage === 0) {
            return (
                <View style={styles.welcomeArtwork}>
                    <View style={styles.orbitOuter} />
                    <View style={styles.orbitInner} />
                    <View style={styles.brandOrb}>
                        <MusicNotes
                            color={colors.white}
                            size={52}
                            weight="fill"
                        />
                    </View>
                    <View style={[styles.featureChip, styles.habitsChip]}>
                        <Stack color={colors.success} size={18} weight="bold" />
                        <Text style={styles.featureChipText}>Hábitos</Text>
                    </View>
                    <View style={[styles.featureChip, styles.scheduleChip]}>
                        <CalendarBlank
                            color={colors.scheduleBackground}
                            size={18}
                            weight="bold"
                        />
                        <Text style={styles.featureChipText}>Rotina</Text>
                    </View>
                    <View style={styles.orbitDot} />
                </View>
            )
        }

        if (currentPage === 1) {
            return (
                <View style={styles.mockCard}>
                    <View style={styles.mockCardHeader}>
                        <View>
                            <Text style={styles.mockOverline}>
                                SEUS HÁBITOS
                            </Text>
                            <Text style={styles.mockTitle}>Todo dia conta</Text>
                        </View>
                        <View style={styles.streakBadge}>
                            <Fire
                                color={colors.priorityMedium}
                                size={18}
                                weight="fill"
                            />
                            <Text style={styles.streakText}>7 dias</Text>
                        </View>
                    </View>
                    <View style={styles.habitRow}>
                        <CheckCircle
                            color={colors.success}
                            size={22}
                            weight="fill"
                        />
                        <Text style={styles.habitText}>Ler por 15 minutos</Text>
                        <Text style={styles.habitTime}>08:30</Text>
                    </View>
                    <View style={styles.habitRow}>
                        <CheckCircle
                            color={colors.success}
                            size={22}
                            weight="fill"
                        />
                        <Text style={styles.habitText}>Beber água</Text>
                        <Text style={styles.habitTime}>12:00</Text>
                    </View>
                    <View style={styles.habitRow}>
                        <View style={styles.emptyCheck} />
                        <Text style={styles.habitText}>Alongar o corpo</Text>
                        <Text style={styles.habitTime}>18:00</Text>
                    </View>
                </View>
            )
        }

        if (currentPage === 2) {
            return (
                <View style={styles.mockCard}>
                    <View style={styles.scheduleHeader}>
                        <View>
                            <Text style={styles.mockOverline}>
                                QUARTA-FEIRA
                            </Text>
                            <Text style={styles.mockTitle}>
                                Seu dia, com espaço
                            </Text>
                        </View>
                        <CalendarBlank
                            color={colors.scheduleBackground}
                            size={26}
                            weight="duotone"
                        />
                    </View>
                    <View style={styles.timelineRow}>
                        <Text style={styles.timelineTime}>09:00</Text>
                        <View style={styles.timelineLine} />
                        <View style={styles.eventBlock}>
                            <Text style={styles.eventTitle}>
                                Reunião de projeto
                            </Text>
                            <Text style={styles.eventSubtitle}>
                                Trabalho · 30 min
                            </Text>
                        </View>
                    </View>
                    <View style={styles.timelineRow}>
                        <Text style={styles.timelineTime}>17:30</Text>
                        <View
                            style={[
                                styles.timelineLine,
                                styles.timelineLineAccent,
                            ]}
                        />
                        <View
                            style={[styles.eventBlock, styles.linkedEventBlock]}
                        >
                            <Text style={styles.eventTitle}>Caminhada</Text>
                            <Text style={styles.eventSubtitle}>
                                Hábito conectado
                            </Text>
                        </View>
                    </View>
                </View>
            )
        }

        if (currentPage === 3) {
            return (
                <View style={styles.remindersArtwork}>
                    <View style={styles.bellOrb}>
                        <Bell color={colors.white} size={42} weight="duotone" />
                        <View style={styles.bellDot} />
                    </View>
                    <View style={[styles.reminderCard, styles.reminderCardTop]}>
                        <View style={styles.reminderIcon}>
                            <CalendarBlank
                                color={colors.scheduleBackground}
                                size={19}
                                weight="bold"
                            />
                        </View>
                        <View style={styles.reminderCopy}>
                            <Text style={styles.reminderTitle}>Consulta</Text>
                            <Text style={styles.reminderSubtitle}>
                                Hoje, às 14:00
                            </Text>
                        </View>
                        <View style={styles.reminderIndicator} />
                    </View>
                    <View
                        style={[styles.reminderCard, styles.reminderCardBottom]}
                    >
                        <View
                            style={[
                                styles.reminderIcon,
                                styles.reminderIconWarm,
                            ]}
                        >
                            <Lightning
                                color={colors.priorityMedium}
                                size={19}
                                weight="fill"
                            />
                        </View>
                        <View style={styles.reminderCopy}>
                            <Text style={styles.reminderTitle}>
                                Pausa para você
                            </Text>
                            <Text style={styles.reminderSubtitle}>
                                Seu momento de respirar
                            </Text>
                        </View>
                        <CheckCircle
                            color={colors.success}
                            size={20}
                            weight="fill"
                        />
                    </View>
                </View>
            )
        }

        return (
            <View style={styles.goalArtwork}>
                <View style={styles.goalCard}>
                    <View style={styles.goalCardHeader}>
                        <View style={styles.goalIcon}>
                            <Lightning
                                color={colors.white}
                                size={23}
                                weight="fill"
                            />
                        </View>
                        <View style={styles.goalHeading}>
                            <Text style={styles.mockOverline}>
                                OBJETIVO DA SEMANA
                            </Text>
                            <Text style={styles.goalTitle}>Mais movimento</Text>
                        </View>
                        <Text style={styles.goalPercent}>75%</Text>
                    </View>
                    <View style={styles.progressTrack}>
                        <View style={styles.progressFill} />
                    </View>
                    <View style={styles.goalTaskRow}>
                        <CheckCircle
                            color={colors.success}
                            size={19}
                            weight="fill"
                        />
                        <Text style={styles.completedGoalTask}>
                            Caminhar na segunda
                        </Text>
                    </View>
                    <View style={styles.goalTaskRow}>
                        <CheckCircle
                            color={colors.success}
                            size={19}
                            weight="fill"
                        />
                        <Text style={styles.completedGoalTask}>
                            Fazer alongamento
                        </Text>
                    </View>
                    <View style={styles.goalTaskRow}>
                        <View style={styles.emptyCheckSmall} />
                        <Text style={styles.habitText}>
                            Pedalar no fim de semana
                        </Text>
                    </View>
                </View>
                <View style={styles.goalSparkle}>
                    <Lightning
                        color={colors.priorityMedium}
                        size={19}
                        weight="fill"
                    />
                </View>
            </View>
        )
    }

    return (
        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
            <StatusBar barStyle="light-content" />
            <ScrollView
                bounces={false}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.screen}>
                    <View style={styles.topBar}>
                        <View style={styles.brand}>
                            <View style={styles.brandMark}>
                                <MusicNotes
                                    color={colors.white}
                                    size={21}
                                    weight="fill"
                                />
                            </View>
                            <Text style={styles.brandName}>ritmo</Text>
                        </View>
                        <Pressable
                            accessibilityRole="button"
                            onPress={onComplete}
                            style={styles.skipButton}
                        >
                            <Text style={styles.skipText}>Pular</Text>
                        </Pressable>
                    </View>

                    <View
                        style={[
                            styles.artworkArea,
                            {
                                height: Math.min(
                                    360,
                                    Math.max(260, height * 0.38),
                                ),
                            },
                        ]}
                    >
                        {renderArtwork()}
                    </View>

                    <View style={styles.copy}>
                        <Text style={styles.eyebrow}>{page.eyebrow}</Text>
                        <Text accessibilityRole="header" style={styles.title}>
                            {page.title}
                        </Text>
                        <Text style={styles.description}>
                            {page.description}
                        </Text>
                    </View>

                    <View style={styles.footer}>
                        <View style={styles.progressRow}>
                            <View
                                accessibilityLabel={`Tela ${
                                    currentPage + 1
                                } de ${onboardingPages.length}`}
                                accessibilityRole="progressbar"
                                style={styles.pagination}
                            >
                                {onboardingPages.map((_, index) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.paginationDot,
                                            index === currentPage &&
                                                styles.paginationDotActive,
                                        ]}
                                    />
                                ))}
                            </View>
                            <Text style={styles.progressCount}>
                                {String(currentPage + 1).padStart(2, '0')} / 05
                            </Text>
                        </View>

                        <View style={styles.actions}>
                            {currentPage > 0 ? (
                                <Pressable
                                    accessibilityLabel="Voltar para a tela anterior"
                                    accessibilityRole="button"
                                    onPress={handlePrevious}
                                    style={({ pressed }) => [
                                        styles.backButton,
                                        pressed && styles.buttonPressed,
                                    ]}
                                >
                                    <CaretLeft
                                        color={colors.text}
                                        size={21}
                                        weight="bold"
                                    />
                                </Pressable>
                            ) : null}
                            <Pressable
                                accessibilityRole="button"
                                onPress={handleContinue}
                                style={({ pressed }) => [
                                    styles.continueButton,
                                    currentPage === 0 &&
                                        styles.firstContinueButton,
                                    pressed && styles.buttonPressed,
                                ]}
                            >
                                <Text style={styles.continueText}>
                                    {isLastPage ? 'Vamos começar' : 'Continuar'}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: { backgroundColor: colors.background, flex: 1 },
    scrollContent: { flexGrow: 1 },
    screen: {
        alignSelf: 'center',
        flex: 1,
        maxWidth: 500,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.sm,
        width: '100%',
    },
    topBar: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        minHeight: 48,
    },
    brand: { alignItems: 'center', flexDirection: 'row' },
    brandMark: {
        alignItems: 'center',
        backgroundColor: colors.accentStrong,
        borderRadius: 13,
        height: 36,
        justifyContent: 'center',
        marginRight: spacing.sm,
        width: 36,
    },
    brandName: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 21,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    skipButton: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: spacing.touchTarget,
        minWidth: spacing.touchTarget,
    },
    skipText: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 14,
        fontWeight: '600',
    },
    artworkArea: { alignItems: 'center', justifyContent: 'center' },
    welcomeArtwork: {
        alignItems: 'center',
        height: 300,
        justifyContent: 'center',
        width: '100%',
    },
    orbitOuter: {
        borderColor: colors.border,
        borderRadius: 150,
        borderWidth: 1,
        height: 276,
        position: 'absolute',
        width: 276,
    },
    orbitInner: {
        borderColor: colors.surfaceMuted,
        borderRadius: 120,
        borderWidth: 1,
        height: 220,
        position: 'absolute',
        width: 220,
    },
    brandOrb: {
        alignItems: 'center',
        backgroundColor: colors.accentStrong,
        borderColor: colors.scheduleLinked,
        borderRadius: 54,
        borderWidth: 8,
        height: 108,
        justifyContent: 'center',
        width: 108,
    },
    featureChip: {
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: 16,
        borderWidth: 1,
        flexDirection: 'row',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        position: 'absolute',
    },
    habitsChip: { left: '4%', top: 43 },
    scheduleChip: { bottom: 40, right: '2%' },
    featureChipText: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 13,
        fontWeight: '600',
        marginLeft: spacing.xs,
    },
    orbitDot: {
        backgroundColor: colors.priorityMedium,
        borderRadius: 5,
        height: 10,
        position: 'absolute',
        right: '16%',
        top: 51,
        width: 10,
    },
    mockCard: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: 24,
        borderWidth: 1,
        maxWidth: 390,
        padding: spacing.lg,
        width: '100%',
    },
    mockCardHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    mockOverline: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
    },
    mockTitle: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 19,
        fontWeight: '700',
        marginTop: spacing.xxs,
    },
    streakBadge: {
        alignItems: 'center',
        backgroundColor: colors.surfaceMuted,
        borderRadius: 14,
        flexDirection: 'row',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
    },
    streakText: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 12,
        fontWeight: '700',
        marginLeft: spacing.xs,
    },
    habitRow: {
        alignItems: 'center',
        borderTopColor: colors.border,
        borderTopWidth: StyleSheet.hairlineWidth,
        flexDirection: 'row',
        minHeight: 53,
    },
    habitText: {
        color: colors.text,
        flex: 1,
        fontFamily: typography.fontFamily,
        fontSize: 13,
        fontWeight: '600',
        marginLeft: spacing.sm,
    },
    habitTime: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 11,
        marginLeft: spacing.xs,
    },
    emptyCheck: {
        borderColor: colors.textMuted,
        borderRadius: 11,
        borderWidth: 1.5,
        height: 22,
        width: 22,
    },
    scheduleHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    timelineRow: {
        alignItems: 'center',
        flexDirection: 'row',
        marginBottom: spacing.sm,
    },
    timelineTime: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 11,
        width: 45,
    },
    timelineLine: {
        backgroundColor: colors.scheduleBackground,
        borderRadius: 3,
        height: 46,
        marginRight: spacing.sm,
        width: 3,
    },
    timelineLineAccent: { backgroundColor: colors.success },
    eventBlock: {
        backgroundColor: colors.surfaceMuted,
        borderRadius: 13,
        flex: 1,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    linkedEventBlock: { backgroundColor: colors.scheduleCurrent },
    eventTitle: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 13,
        fontWeight: '700',
    },
    eventSubtitle: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 11,
        marginTop: 2,
    },
    remindersArtwork: {
        alignItems: 'center',
        height: 300,
        justifyContent: 'center',
        maxWidth: 390,
        position: 'relative',
        width: '100%',
    },
    bellOrb: {
        alignItems: 'center',
        backgroundColor: colors.scheduleCurrent,
        borderColor: colors.scheduleLinked,
        borderRadius: 48,
        borderWidth: 1,
        height: 96,
        justifyContent: 'center',
        width: 96,
    },
    bellDot: {
        backgroundColor: colors.priorityMedium,
        borderColor: colors.background,
        borderRadius: 7,
        borderWidth: 2,
        height: 14,
        position: 'absolute',
        right: 19,
        top: 19,
        width: 14,
    },
    reminderCard: {
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: 16,
        borderWidth: 1,
        flexDirection: 'row',
        left: 0,
        padding: spacing.sm,
        position: 'absolute',
        right: 0,
    },
    reminderCardTop: { top: 19 },
    reminderCardBottom: { bottom: 15 },
    reminderIcon: {
        alignItems: 'center',
        backgroundColor: colors.surfaceMuted,
        borderRadius: 12,
        height: 40,
        justifyContent: 'center',
        width: 40,
    },
    reminderIconWarm: { backgroundColor: colors.background },
    reminderCopy: { flex: 1, marginLeft: spacing.sm },
    reminderTitle: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 12,
        fontWeight: '700',
    },
    reminderSubtitle: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 10,
        marginTop: 2,
    },
    reminderIndicator: {
        backgroundColor: colors.accentStrong,
        borderRadius: 4,
        height: 8,
        width: 8,
    },
    goalArtwork: {
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: 390,
        position: 'relative',
        width: '100%',
    },
    goalCard: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: 24,
        borderWidth: 1,
        padding: spacing.lg,
        width: '100%',
    },
    goalCardHeader: { alignItems: 'center', flexDirection: 'row' },
    goalIcon: {
        alignItems: 'center',
        backgroundColor: colors.accentStrong,
        borderRadius: 14,
        height: 42,
        justifyContent: 'center',
        width: 42,
    },
    goalHeading: { flex: 1, marginLeft: spacing.sm },
    goalTitle: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 15,
        fontWeight: '700',
        marginTop: 2,
    },
    goalPercent: {
        color: colors.success,
        fontFamily: typography.fontFamily,
        fontSize: 14,
        fontWeight: '700',
    },
    progressTrack: {
        backgroundColor: colors.surfaceMuted,
        borderRadius: 5,
        height: 8,
        marginVertical: spacing.md,
        overflow: 'hidden',
    },
    progressFill: {
        backgroundColor: colors.success,
        borderRadius: 5,
        height: '100%',
        width: '75%',
    },
    goalTaskRow: { alignItems: 'center', flexDirection: 'row', minHeight: 34 },
    completedGoalTask: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 12,
        marginLeft: spacing.sm,
        textDecorationLine: 'line-through',
    },
    emptyCheckSmall: {
        borderColor: colors.textMuted,
        borderRadius: 10,
        borderWidth: 1.5,
        height: 19,
        width: 19,
    },
    goalSparkle: {
        alignItems: 'center',
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.border,
        borderRadius: 20,
        borderWidth: 1,
        height: 42,
        justifyContent: 'center',
        position: 'absolute',
        right: -10,
        top: -13,
        width: 42,
    },
    copy: { marginTop: spacing.sm },
    eyebrow: {
        color: colors.success,
        fontFamily: typography.fontFamily,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.35,
        marginBottom: spacing.xs,
    },
    title: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 29,
        fontWeight: '700',
        letterSpacing: -0.7,
        lineHeight: 36,
    },
    description: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 14,
        lineHeight: 21,
        marginTop: spacing.xs,
    },
    footer: { marginTop: 'auto', paddingTop: spacing.lg },
    progressRow: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    pagination: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
    paginationDot: {
        backgroundColor: colors.surfaceMuted,
        borderRadius: 4,
        height: 7,
        width: 7,
    },
    paginationDotActive: {
        backgroundColor: colors.accentStrong,
        width: 22,
    },
    progressCount: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.8,
    },
    actions: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
    backButton: {
        alignItems: 'center',
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.border,
        borderRadius: 15,
        borderWidth: 1,
        height: 56,
        justifyContent: 'center',
        width: 56,
    },
    continueButton: {
        alignItems: 'center',
        backgroundColor: colors.accentStrong,
        borderRadius: 15,
        flex: 1,
        height: 56,
        justifyContent: 'center',
    },
    firstContinueButton: { flex: 1 },
    continueText: {
        color: colors.white,
        fontFamily: typography.fontFamily,
        fontSize: 15,
        fontWeight: '700',
    },
    buttonPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
})
