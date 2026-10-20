import { useCallback, useEffect, useRef, useState } from 'react'
import type { ComponentRef } from 'react'
import { Keyboard, ScrollView, TextInput } from 'react-native'
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'

import { spacing } from '../styles/spacing'

export const useFocusedInputScroll = () => {
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(() =>
        Keyboard.isVisible(),
    )
    const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null)
    const scrollOffset = useRef(0)
    const frameRef = useRef<number | null>(null)

    const ensureFocusedInputVisible = useCallback(() => {
        if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)

        // Wait for keyboard avoidance and content layout before measuring.
        frameRef.current = requestAnimationFrame(() => {
            frameRef.current = null
            const scroll = scrollRef.current
            const input = TextInput.State.currentlyFocusedInput()
            if (!scroll || !input || !Keyboard.isVisible()) return

            scroll.measureInWindow(
                (_x, viewportTop, _width, viewportHeight) => {
                    input.measureInWindow(
                        (_inputX, inputTop, _inputWidth, inputHeight) => {
                            if (
                                scrollRef.current !== scroll ||
                                TextInput.State.currentlyFocusedInput() !==
                                    input ||
                                !Keyboard.isVisible()
                            )
                                return

                            // The viewport also excludes fixed controls below the scroll view.
                            const visibleBottom =
                                Math.min(
                                    viewportTop + viewportHeight,
                                    Keyboard.metrics()?.screenY ?? Infinity,
                                ) - spacing.md
                            const visibleTop = viewportTop + spacing.md
                            const inputBottom = inputTop + inputHeight
                            const delta =
                                inputBottom > visibleBottom
                                    ? inputBottom - visibleBottom
                                    : Math.min(0, inputTop - visibleTop)

                            if (delta === 0) return
                            scroll.scrollTo({
                                y: Math.max(0, scrollOffset.current + delta),
                                animated: false,
                            })
                        },
                    )
                },
            )
        })
    }, [])

    useEffect(() => {
        const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
            setIsKeyboardVisible(true)
            ensureFocusedInputVisible()
        })
        const hideSubscription = Keyboard.addListener('keyboardDidHide', () =>
            setIsKeyboardVisible(false),
        )
        const frameSubscription = Keyboard.addListener(
            'keyboardDidChangeFrame',
            ensureFocusedInputVisible,
        )

        return () => {
            showSubscription.remove()
            hideSubscription.remove()
            frameSubscription.remove()
            if (frameRef.current !== null)
                cancelAnimationFrame(frameRef.current)
        }
    }, [ensureFocusedInputVisible])

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        scrollOffset.current = event.nativeEvent.contentOffset.y
    }

    return {
        scrollRef,
        ensureFocusedInputVisible,
        handleScroll,
        isKeyboardVisible,
    }
}
