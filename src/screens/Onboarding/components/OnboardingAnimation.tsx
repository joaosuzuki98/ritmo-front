import { useState } from 'react'
import LottieView from 'lottie-react-native'
import { StyleSheet, View, useWindowDimensions } from 'react-native'

import { spacing } from '../../../styles/spacing'
import { remindersAnimation } from '../remindersAnimation'

type OnboardingAnimationProps = {
    page: number
}

const animationSources = {
    2: {
        source: require('../../../assets/animations/moon_welcoming.json'),
        compositionWidth: 440,
        compositionHeight: 120,
        maxWidth: 400,
    },
    3: {
        source: require('../../../assets/animations/moon_idle_happy.json'),
        compositionWidth: 128,
        compositionHeight: 120,
        maxWidth: 140,
    },
    4: {
        source: require('../../../assets/animations/moon_rotating.json'),
        compositionWidth: 128,
        compositionHeight: 120,
        maxWidth: 140,
    },
    5: {
        source: require('../../../assets/animations/moon_habits.json'),
        compositionWidth: 440,
        compositionHeight: 282,
        maxWidth: 400,
    },
    6: {
        source: require('../../../assets/animations/moon_schedule.json'),
        compositionWidth: 440,
        compositionHeight: 293,
        maxWidth: 400,
    },
    7: {
        source: remindersAnimation,
        compositionWidth: 237,
        compositionHeight: 191,
        maxWidth: 237,
    },
} as const

export const getOnboardingAnimationHeight = (
    page: number,
    screenWidth: number,
) => {
    const layout =
        animationSources[
            (page === 2 ? 3 : page) as keyof typeof animationSources
        ]
    if (!layout) return 0

    const width = Math.min(
        layout.maxWidth,
        Math.max(screenWidth - spacing.xl * 2, spacing.touchTarget),
    )
    return Math.round(
        (width * layout.compositionHeight) / layout.compositionWidth,
    )
}

export const OnboardingAnimation = ({ page }: OnboardingAnimationProps) => {
    const { width: screenWidth } = useWindowDimensions()
    const [playback, setPlayback] = useState({
        page,
        isWelcoming: page === 2,
    })
    const isWelcoming =
        page === 2 && (playback.page !== page || playback.isWelcoming)
    const animation =
        page === 2 && !isWelcoming
            ? animationSources[3]
            : animationSources[page as keyof typeof animationSources]

    if (!animation) return null

    // Use page 3's mascot scale for both phases, keeping the height fixed during the transition.
    const layout = page === 2 ? animationSources[3] : animation
    const width = Math.min(
        layout.maxWidth,
        Math.max(screenWidth - spacing.xl * 2, spacing.touchTarget),
    )
    const height = getOnboardingAnimationHeight(page, screenWidth)
    const animationWidth =
        (width * animation.compositionWidth) / layout.compositionWidth

    return (
        <View
            accessibilityLabel={`Illustration for onboarding page ${page}`}
            style={[styles.container, { height, width }]}
        >
            <LottieView
                autoPlay
                key={`page-${page}-${isWelcoming ? 'welcoming' : 'idle'}`}
                loop={!isWelcoming}
                onAnimationFinish={isCancelled => {
                    if (page === 2 && isWelcoming && !isCancelled) {
                        setPlayback({ page, isWelcoming: false })
                    }
                }}
                resizeMode="contain"
                source={animation.source}
                style={{ height, width: animationWidth }}
                testID="onboarding-lottie-animation"
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: { alignItems: 'center', alignSelf: 'center' },
})
