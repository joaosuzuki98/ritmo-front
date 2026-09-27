import type { ReactNode } from 'react'
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import RitmoLogo from '../../assets/images/ritmo-logo.svg'
import Star from '../../assets/images/star.svg'
import { colors } from '../../styles/colors'
import { spacing } from '../../styles/spacing'
import { typography } from '../../styles/typography'

export type AuthScreenLayoutProps = {
    children: ReactNode
    description: string
    footer?: ReactNode
    title: string
}

const authStars = [
    { left: 7, top: 13, size: 31 },
    { left: 73, top: 4, size: 30 },
    { left: 45, top: 12, size: 21 },
    { left: 61, top: 29, size: 54 },
    { left: 85, top: 36, size: 28 },
    { left: 24, top: 43, size: 38 },
    { left: 46, top: 52, size: 27 },
    { left: 76, top: 56, size: 23 },
    { left: 7, top: 73, size: 31 },
    { left: 82, top: 76, size: 32 },
    { left: 52, top: 86, size: 30 },
    { left: 18, top: 92, size: 37 },
] as const

export const AuthScreenLayout = ({
    children,
    description,
    footer,
    title,
}: AuthScreenLayoutProps) => {
    const { height, width } = useWindowDimensions()
    const logoWidth = Math.min(width * 0.6, 228)

    return (
        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
            <StatusBar barStyle="light-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardView}
            >
                <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                    {authStars.map(star => (
                        <View
                            key={`${star.left}-${star.top}`}
                            style={[
                                styles.star,
                                {
                                    height: star.size,
                                    left: `${star.left}%`,
                                    top: `${star.top}%`,
                                    width: star.size,
                                },
                            ]}
                        >
                            <Star height="100%" width="100%" />
                        </View>
                    ))}
                </View>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.content}>
                        <View
                            style={[
                                styles.heading,
                                {
                                    marginBottom: Math.min(height * 0.06, 60),
                                    paddingTop: Math.min(height * 0.075, 72),
                                },
                            ]}
                        >
                            <RitmoLogo
                                height={(logoWidth * 52) / 228}
                                width={logoWidth}
                            />
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
    safeArea: { backgroundColor: colors.onboardingBackground, flex: 1 },
    keyboardView: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: spacing.md,
    },
    content: {
        alignSelf: 'center',
        flexGrow: 1,
        maxWidth: 440,
        width: '100%',
    },
    star: {
        position: 'absolute',
    },
    heading: {
        alignItems: 'center',
        width: '100%',
    },
    title: {
        color: colors.text,
        fontFamily:
            Platform.OS === 'android'
                ? 'quattrocento-sans'
                : typography.onboardingFontFamily,
        fontSize: 22,
        lineHeight: 32,
        marginTop: spacing.lg,
        textAlign: 'center',
    },
    description: {
        color: colors.onboardingPurple,
        fontFamily:
            Platform.OS === 'android'
                ? 'quattrocento-sans'
                : typography.onboardingFontFamily,
        fontSize: 16,
        lineHeight: 40,
        marginTop: spacing.md,
        textAlign: 'center',
        width: '100%',
    },
    footer: {
        alignItems: 'center',
        marginBottom: spacing.xl,
        marginTop: 'auto',
        paddingTop: spacing.md,
    },
})
