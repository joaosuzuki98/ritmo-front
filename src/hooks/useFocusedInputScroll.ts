import { useCallback, useEffect, useRef, useState } from 'react'
import type { ComponentRef, RefObject } from 'react'
import { Keyboard, ScrollView, TextInput } from 'react-native'
import type {
    NativeScrollEvent,
    NativeSyntheticEvent,
    View,
} from 'react-native'

import { spacing } from '../styles/spacing'

export const useFocusedInputScroll = (
    bottomContentRef?: RefObject<ComponentRef<typeof View> | null>,
) => {
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(() =>
        Keyboard.isVisible(),
    )
    const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null)
    const scrollOffset = useRef(0)
    const frameRef = useRef<number | null>(null)

    const resetScroll = useCallback(() => {
        if (frameRef.current !== null) {
            cancelAnimationFrame(frameRef.current)
            frameRef.current = null
        }
        scrollOffset.current = 0
        scrollRef.current?.scrollTo({ y: 0, animated: false })
    }, [])

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
                            const revealContent = (contentBottom: number) => {
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
                                const requiredBottom = Math.max(
                                    inputTop + inputHeight,
                                    contentBottom,
                                )
                                // Keep the input visible when its supporting content cannot fit above the keyboard.
                                const delta =
                                    inputTop < visibleTop
                                        ? inputTop - visibleTop
                                        : Math.min(
                                              Math.max(
                                                  0,
                                                  requiredBottom -
                                                      visibleBottom,
                                              ),
                                              inputTop - visibleTop,
                                          )

                                if (delta === 0) return
                                scroll.scrollTo({
                                    y: Math.max(
                                        0,
                                        scrollOffset.current + delta,
                                    ),
                                    animated: false,
                                })
                            }

                            const bottomContent = bottomContentRef?.current
                            if (bottomContent) {
                                bottomContent.measureInWindow(
                                    (
                                        _contentX,
                                        contentTop,
                                        _contentWidth,
                                        contentHeight,
                                    ) =>
                                        revealContent(
                                            contentTop + contentHeight,
                                        ),
                                )
                            } else {
                                revealContent(inputTop + inputHeight)
                            }
                        },
                    )
                },
            )
        })
    }, [bottomContentRef])

    useEffect(() => {
        ensureFocusedInputVisible()
    }, [ensureFocusedInputVisible])

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
        resetScroll,
        ensureFocusedInputVisible,
        handleScroll,
        isKeyboardVisible,
    }
}
