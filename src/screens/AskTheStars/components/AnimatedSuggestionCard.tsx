import { useEffect, useRef } from 'react'
import type { PropsWithChildren } from 'react'
import { Animated, Easing } from 'react-native'

import { spacing } from '../../../styles/spacing'

type AnimatedSuggestionCardProps = PropsWithChildren<{
    index: number
}>

export const AnimatedSuggestionCard = ({
    index,
    children,
}: AnimatedSuggestionCardProps) => {
    const progress = useRef(new Animated.Value(0)).current

    useEffect(() => {
        const animation = Animated.timing(progress, {
            toValue: 1,
            duration: 320,
            delay: index * 100,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        })
        animation.start()
        return () => animation.stop()
    }, [index, progress])

    return (
        <Animated.View
            style={{
                opacity: progress,
                transform: [
                    {
                        translateY: progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [spacing.md, 0],
                        }),
                    },
                ],
            }}
        >
            {children}
        </Animated.View>
    )
}
