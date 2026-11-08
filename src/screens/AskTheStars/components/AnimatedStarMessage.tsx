import { memo, useCallback, useRef } from 'react'
import { Animated, Easing, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'

import { theme } from '../../../styles/theme'

type AnimatedStarMessageProps = {
    message: string
    onAnimationStart?: () => void
    onAnimationComplete?: () => void
}

const letterDelay = 45
const popDuration = 220

export const AnimatedStarMessage = memo(
    ({
        message,
        onAnimationStart,
        onAnimationComplete,
    }: AnimatedStarMessageProps) => {
        const progress = useRef(new Animated.Value(0)).current
        const callbacks = useRef({ onAnimationStart, onAnimationComplete })
        callbacks.current = { onAnimationStart, onAnimationComplete }

        useFocusEffect(
            useCallback(() => {
                let isActive = true
                callbacks.current.onAnimationStart?.()
                const duration =
                    Array.from(message).length * letterDelay + popDuration
                progress.setValue(0)
                const animation = Animated.timing(progress, {
                    toValue: duration,
                    duration,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
                animation.start(({ finished }) => {
                    if (finished && isActive)
                        callbacks.current.onAnimationComplete?.()
                })

                return () => {
                    isActive = false
                    animation.stop()
                }
            }, [message, progress]),
        )

        let characterIndex = 0

        return (
            <View
                accessible
                accessibilityLabel={message}
                accessibilityRole="text"
                className="mb-4 self-stretch"
            >
                <View
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    className="flex-row flex-wrap justify-center"
                >
                    {message.split(/(\s+)/).map((word, wordIndex) => (
                        <View key={wordIndex} className="flex-row">
                            {Array.from(word).map(character => {
                                const index = characterIndex++
                                const start = (index + 1) * letterDelay

                                return (
                                    <Animated.Text
                                        key={index}
                                        accessible={false}
                                        style={{
                                            color: theme.colors
                                                .onboardingPurple,
                                            fontFamily:
                                                theme.typography.fontFamily,
                                            fontSize:
                                                theme.typography.body.fontSize,
                                            lineHeight:
                                                theme.typography.body
                                                    .lineHeight,
                                            opacity: progress.interpolate({
                                                inputRange: [
                                                    start,
                                                    start + 100,
                                                ],
                                                outputRange: [0, 1],
                                                extrapolate: 'clamp',
                                            }),
                                            transform: [
                                                {
                                                    scale: progress.interpolate(
                                                        {
                                                            inputRange: [
                                                                start,
                                                                start + 100,
                                                                start +
                                                                    popDuration,
                                                            ],
                                                            outputRange: [
                                                                0.8, 1.1, 1,
                                                            ],
                                                            extrapolate:
                                                                'clamp',
                                                        },
                                                    ),
                                                },
                                            ],
                                        }}
                                    >
                                        {character}
                                    </Animated.Text>
                                )
                            })}
                        </View>
                    ))}
                </View>
            </View>
        )
    },
)

AnimatedStarMessage.displayName = 'AnimatedStarMessage'
