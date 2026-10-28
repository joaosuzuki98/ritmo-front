import { useEffect, useRef, useState } from 'react'
import { Animated, Easing } from 'react-native'

import { theme } from '../styles/theme'

export const useBottomSheetAnimation = (
    isVisible: boolean,
    height: number,
    onDismiss?: () => void,
) => {
    const [isModalMounted, setIsModalMounted] = useState(false)
    const backdropOpacity = useRef(new Animated.Value(0)).current
    const sheetProgress = useRef(new Animated.Value(1)).current
    const wasVisible = useRef(false)
    const onDismissRef = useRef(onDismiss)

    useEffect(() => {
        onDismissRef.current = onDismiss
    }, [onDismiss])

    useEffect(() => {
        if (isVisible) {
            wasVisible.current = true
            setIsModalMounted(true)
            backdropOpacity.setValue(0)
            sheetProgress.setValue(1)

            const animation = Animated.parallel([
                Animated.timing(backdropOpacity, {
                    toValue: 1,
                    duration: theme.bottomSheet.backdropOpenDuration,
                    useNativeDriver: true,
                }),
                Animated.timing(sheetProgress, {
                    toValue: 0,
                    duration: theme.bottomSheet.openDuration,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ])
            const animationFrame = requestAnimationFrame(() =>
                animation.start(),
            )

            return () => {
                cancelAnimationFrame(animationFrame)
                animation.stop()
            }
        }

        if (!wasVisible.current) return

        wasVisible.current = false
        const animation = Animated.parallel([
            Animated.timing(backdropOpacity, {
                toValue: 0,
                duration: 180,
                useNativeDriver: true,
            }),
            Animated.timing(sheetProgress, {
                toValue: 1,
                duration: 220,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }),
        ])
        animation.start(({ finished }) => {
            if (finished) {
                setIsModalMounted(false)
                onDismissRef.current?.()
            }
        })

        return () => animation.stop()
    }, [backdropOpacity, isVisible, sheetProgress])

    const sheetTranslateY = sheetProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, height],
    })

    return { backdropOpacity, isModalMounted, sheetTranslateY }
}
