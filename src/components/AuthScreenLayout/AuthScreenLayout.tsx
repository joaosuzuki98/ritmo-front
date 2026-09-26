import type { ReactNode } from 'react'
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ArrowLeft, MusicNotes } from 'phosphor-react-native'

import { colors } from '../../styles/colors'
import { spacing } from '../../styles/spacing'
import { typography } from '../../styles/typography'

export type AuthScreenLayoutProps = {
    children: ReactNode
    description: string
    footer?: ReactNode
    onBack?: () => void
    title: string
}

export const AuthScreenLayout = ({
    children,
    description,
    footer,
    onBack,
    title,
}: AuthScreenLayoutProps) => {
    return (
        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
            <StatusBar barStyle="light-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardView}
            >
                <View pointerEvents="none" style={styles.backgroundGlow} />
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.content}>
                        {onBack ? (
                            <Pressable
                                accessibilityLabel="Voltar"
                                accessibilityRole="button"
                                hitSlop={8}
                                onPress={onBack}
                                style={styles.backButton}
                            >
                                <ArrowLeft
                                    color={colors.textMuted}
                                    size={20}
                                    weight="bold"
                                />
                                <Text style={styles.backText}>Voltar</Text>
                            </Pressable>
                        ) : null}

                        <View style={styles.brandRow}>
                            <View style={styles.brandMark}>
                                <MusicNotes
                                    color={colors.white}
                                    size={25}
                                    weight="fill"
                                />
                            </View>
                            <View>
                                <Text style={styles.brandName}>ritmo</Text>
                                <Text style={styles.brandCaption}>
                                    UM PASSO DE CADA VEZ
                                </Text>
                            </View>
                        </View>

                        <View style={styles.heading}>
                            <Text style={styles.title}>{title}</Text>
                            <Text style={styles.description}>
                                {description}
                            </Text>
                        </View>

                        {children}
                        {footer ? (
                            <View style={styles.footer}>{footer}</View>
                        ) : null}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: { backgroundColor: colors.background, flex: 1 },
    keyboardView: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.xl,
    },
    content: {
        alignSelf: 'center',
        maxWidth: 440,
        width: '100%',
    },
    backgroundGlow: {
        backgroundColor: colors.accent,
        borderRadius: 160,
        height: 320,
        opacity: 0.12,
        position: 'absolute',
        right: -180,
        top: -200,
        width: 320,
    },
    backButton: {
        alignItems: 'center',
        alignSelf: 'flex-start',
        flexDirection: 'row',
        marginBottom: spacing.lg,
        minHeight: spacing.touchTarget,
    },
    backText: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 14,
        marginLeft: spacing.xs,
    },
    brandRow: {
        alignItems: 'center',
        flexDirection: 'row',
        marginBottom: spacing.xl,
    },
    brandMark: {
        alignItems: 'center',
        backgroundColor: colors.accentStrong,
        borderRadius: 17,
        height: 52,
        justifyContent: 'center',
        marginRight: spacing.md,
        width: 52,
    },
    brandName: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 25,
        fontWeight: '700',
        letterSpacing: -0.6,
        lineHeight: 28,
    },
    brandCaption: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 9,
        fontWeight: '600',
        letterSpacing: 1.1,
        marginTop: 2,
    },
    heading: { marginBottom: spacing.lg },
    title: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 31,
        fontWeight: '700',
        letterSpacing: -0.7,
        lineHeight: 38,
    },
    description: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 15,
        lineHeight: 22,
        marginTop: spacing.xs,
    },
    footer: { alignItems: 'center', marginTop: spacing.lg },
})
