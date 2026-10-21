import type { ReactNode } from 'react'
import {
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
import { StarBackground } from '../StarBackground'
import { colors } from '../../styles/colors'
import { spacing } from '../../styles/spacing'
import { typography } from '../../styles/typography'

export type AuthScreenLayoutProps = {
    children: ReactNode
    description: string
    footer?: ReactNode
    title: string
}

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
            <View style={styles.body}>
                <StarBackground />
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardDismissMode="on-drag"
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
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: { backgroundColor: colors.onboardingBackground, flex: 1 },
    body: { flex: 1 },
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
