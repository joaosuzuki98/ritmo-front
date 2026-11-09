import { memo } from 'react'
import LottieView from 'lottie-react-native'

type StarMoonAnimationProps = {
    width: number
}

// Keep text and data updates from reconfiguring the native animation.
export const StarMoonAnimation = memo(({ width }: StarMoonAnimationProps) => (
    <LottieView
        autoPlay
        loop
        resizeMode="contain"
        source={require('../../../assets/animations/moon_idle.json')}
        style={{ height: (width * 120) / 135, width }}
    />
))

StarMoonAnimation.displayName = 'StarMoonAnimation'
