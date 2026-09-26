import { useEffect, useRef, useState } from 'react'
import { Animated, Easing } from 'react-native'

export const useHabitSheetAnimation = (isVisible: boolean, height: number) => {
    const [isModalMounted, setIsModalMounted] = useState(false)
    const backdropOpacity = useRef(new Animated.Value(0)).current
    const sheetProgress = useRef(new Animated.Value(1)).current
    const wasVisible = useRef(false)

    useEffect(() => {
        if (isVisible) {
            wasVisible.current = true
            setIsModalMounted(true)
            backdropOpacity.setValue(0)
            sheetProgress.setValue(1)

            const animationFrame = requestAnimationFrame(() => {
                Animated.parallel([
                    Animated.timing(backdropOpacity, {
                        toValue: 1,
                        duration: 180,
                        useNativeDriver: true,
                    }),
                    Animated.timing(sheetProgress, {
                        toValue: 0,
                        duration: 260,
                        easing: Easing.out(Easing.cubic),
                        useNativeDriver: true,
                    }),
                ]).start()
            })

            return () => cancelAnimationFrame(animationFrame)
        }

        if (!wasVisible.current) return

        wasVisible.current = false
        Animated.parallel([
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
        ]).start(({ finished }) => {
            if (finished) setIsModalMounted(false)
        })
    }, [backdropOpacity, isVisible, sheetProgress])

    const sheetTranslateY = sheetProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, height],
    })

    return { backdropOpacity, isModalMounted, sheetTranslateY }
}
