import type { ComponentRef, RefObject } from 'react'
import { Keyboard, ScrollView, TextInput, View } from 'react-native'
import { act, create } from 'react-test-renderer'
import type { ReactTestRenderer } from 'react-test-renderer'

import { useFocusedInputScroll } from '../../src/hooks/useFocusedInputScroll'

type ViewInstance = ComponentRef<typeof View>

const measureAt =
    (top: number, height: number): ViewInstance['measureInWindow'] =>
    callback =>
        callback(0, top, 320, height)

describe('useFocusedInputScroll', () => {
    let renderer: ReactTestRenderer
    let scrollHook: ReturnType<typeof useFocusedInputScroll>
    const scrollTo = jest.fn()
    const input = {
        measureInWindow: measureAt(380, 40),
    } as ViewInstance

    const Harness = ({
        bottomContentRef,
    }: {
        bottomContentRef?: RefObject<ViewInstance | null>
    }) => {
        scrollHook = useFocusedInputScroll(bottomContentRef)
        return null
    }

    const mount = async (contentBottom?: number) => {
        const bottomContentRef =
            contentBottom === undefined
                ? undefined
                : {
                      current: {
                          measureInWindow: measureAt(436, contentBottom - 436),
                      } as ViewInstance,
                  }
        await act(async () => {
            renderer = create(<Harness bottomContentRef={bottomContentRef} />)
        })
        scrollHook.scrollRef.current = {
            measureInWindow: measureAt(20, 380),
            scrollTo,
        } as unknown as ComponentRef<typeof ScrollView>
    }

    beforeEach(() => {
        jest.useFakeTimers()
        scrollTo.mockClear()
        jest.spyOn(Keyboard, 'isVisible').mockReturnValue(true)
        jest.spyOn(Keyboard, 'metrics').mockReturnValue({
            screenX: 0,
            screenY: 400,
            width: 360,
            height: 300,
        })
        jest.spyOn(TextInput.State, 'currentlyFocusedInput').mockReturnValue(
            input,
        )
    })

    afterEach(async () => {
        await act(async () => renderer?.unmount())
        jest.restoreAllMocks()
        jest.useRealTimers()
    })

    it('leaves a safe gap between the focused input and the keyboard', async () => {
        await mount()
        act(() => jest.runOnlyPendingTimers())
        expect(scrollTo).toHaveBeenCalledWith({ y: 36, animated: false })
    })

    it('reveals the password requirements as well as the input', async () => {
        await mount(540)
        act(() => jest.runOnlyPendingTimers())
        expect(scrollTo).toHaveBeenCalledWith({ y: 156, animated: false })
    })

    it('keeps the input visible when the requirements cannot fit in the viewport', async () => {
        await mount(900)
        act(() => jest.runOnlyPendingTimers())
        expect(scrollTo).toHaveBeenCalledWith({ y: 344, animated: false })
    })

    it('does not scroll after the keyboard closes', async () => {
        await mount(540)
        jest.mocked(Keyboard.isVisible).mockReturnValue(false)
        act(() => jest.runOnlyPendingTimers())
        expect(scrollTo).not.toHaveBeenCalled()
    })

    it('cancels pending automatic scrolling when the page resets', async () => {
        await mount(540)
        act(() => scrollHook.resetScroll())
        expect(scrollTo).toHaveBeenCalledWith({ y: 0, animated: false })
        scrollTo.mockClear()
        act(() => jest.runOnlyPendingTimers())
        expect(scrollTo).not.toHaveBeenCalled()
    })
})
