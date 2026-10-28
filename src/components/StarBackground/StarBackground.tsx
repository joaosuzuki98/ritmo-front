import { useEffect, useState } from 'react'
import { Animated, Easing, View } from 'react-native'

import Star from '../../assets/images/star.svg'
import { theme } from '../../styles/theme'

export const StarBackground = () => {
    const [drifts] = useState(() =>
        theme.starBackground.stars.map(() => new Animated.Value(0)),
    )

    useEffect(() => {
        const motion = theme.starBackground
        const animations = drifts.map((drift, index) => {
            const duration = motion.driftDuration + index * motion.durationStep
            return Animated.loop(
                Animated.sequence([
                    Animated.timing(drift, {
                        toValue: 1,
                        duration,
                        delay: index * motion.delayStep,
                        easing: Easing.inOut(Easing.sin),
                        isInteraction: false,
                        useNativeDriver: true,
                    }),
                    Animated.timing(drift, {
                        toValue: 0,
                        duration,
                        delay: motion.pauseDuration + index * motion.pauseStep,
                        easing: Easing.inOut(Easing.sin),
                        isInteraction: false,
                        useNativeDriver: true,
                    }),
                ]),
            )
        })

        animations.forEach(animation => animation.start())
        return () => animations.forEach(animation => animation.stop())
    }, [drifts])

    return (
        <View
            accessibilityElementsHidden
            className="absolute inset-0"
            importantForAccessibility="no-hide-descendants"
            pointerEvents="none"
        >
            {theme.starBackground.stars.map((star, index) => (
                <Animated.View
                    className="absolute"
                    key={`${star.left}-${star.top}`}
                    style={{
                        height: star.size,
                        left: `${star.left}%`,
                        top: `${star.top}%`,
                        width: star.size,
                        transform: [
                            {
                                translateX: drifts[index].interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-star.driftX, star.driftX],
                                }),
                            },
                            {
                                translateY: drifts[index].interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [star.driftY, -star.driftY],
                                }),
                            },
                            {
                                rotate: drifts[index].interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [
                                        `${-star.rotation}deg`,
                                        `${star.rotation}deg`,
                                    ],
                                }),
                            },
                        ],
                    }}
                >
                    <Star height="100%" width="100%" />
                </Animated.View>
            ))}
        </View>
    )
}
