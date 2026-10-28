import { Animated, Modal, Text } from 'react-native'
import { act, create } from 'react-test-renderer'
import type { ReactTestRenderer } from 'react-test-renderer'

import { BottomSheetLayout } from '../../src/components/BottomSheetLayout'
import type { BottomSheetLayoutProps } from '../../src/components/BottomSheetLayout'

type AnimationCallback = Parameters<Animated.CompositeAnimation['start']>[0]
type ControlledAnimation = {
    finish: () => void
    stop: jest.Mock
}

describe('BottomSheetLayout', () => {
    let renderer: ReactTestRenderer
    let animations: ControlledAnimation[]

    const renderSheet = (props: Partial<BottomSheetLayoutProps> = {}) => (
        <BottomSheetLayout
            closeAccessibilityLabel="Close form"
            isVisible
            onClose={jest.fn()}
            title="Edit item"
            {...props}
        >
            <Text>Form content</Text>
        </BottomSheetLayout>
    )

    beforeEach(() => {
        jest.useFakeTimers()
        animations = []
        jest.spyOn(Animated, 'parallel').mockImplementation(() => {
            let onEnd: AnimationCallback
            const stop = jest.fn(() => onEnd?.({ finished: false }))
            animations.push({
                finish: () => onEnd?.({ finished: true }),
                stop,
            })
            return {
                start: callback => {
                    onEnd = callback
                },
                stop,
                reset: jest.fn(),
            }
        })
    })

    afterEach(() => {
        act(() => renderer?.unmount())
        jest.clearAllTimers()
        jest.useRealTimers()
        jest.restoreAllMocks()
    })

    it('blocks every close path while submitting and enables them afterwards', () => {
        const onClose = jest.fn()
        act(() => {
            renderer = create(renderSheet({ isCloseDisabled: true, onClose }))
        })

        const pressCloseControls = () => {
            const buttons = renderer.root.findAll(
                node =>
                    node.props.accessibilityLabel === 'Close form' &&
                    typeof node.props.onPress === 'function',
                { deep: false },
            )
            expect(buttons).toHaveLength(2)
            buttons.forEach(button => button.props.onPress())
            renderer.root.findByType(Modal).props.onRequestClose()
        }

        act(pressCloseControls)
        expect(onClose).not.toHaveBeenCalled()

        act(() => {
            renderer.update(renderSheet({ isCloseDisabled: false, onClose }))
        })
        act(pressCloseControls)
        expect(onClose).toHaveBeenCalledTimes(3)
    })

    it('retains content until the exit animation ends and calls the latest dismissal handler', () => {
        const onDismiss = jest.fn()
        const latestOnDismiss = jest.fn()
        act(() => {
            renderer = create(renderSheet({ onDismiss }))
        })
        act(() => jest.runOnlyPendingTimers())
        act(() => animations[0].finish())

        act(() => {
            renderer.update(renderSheet({ isVisible: false, onDismiss }))
        })
        expect(renderer.root.findByType(Modal).props.visible).toBe(true)
        expect(
            renderer.root
                .findAllByType(Text)
                .some(text => text.props.children === 'Form content'),
        ).toBe(true)
        expect(onDismiss).not.toHaveBeenCalled()

        act(() => {
            renderer.update(
                renderSheet({ isVisible: false, onDismiss: latestOnDismiss }),
            )
        })
        act(() => animations[1].finish())

        expect(renderer.root.findByType(Modal).props.visible).toBe(false)
        expect(onDismiss).not.toHaveBeenCalled()
        expect(latestOnDismiss).toHaveBeenCalledTimes(1)
    })

    it('cancels dismissal when reopened during the exit animation', () => {
        const onDismiss = jest.fn()
        act(() => {
            renderer = create(renderSheet({ onDismiss }))
        })
        act(() => jest.runOnlyPendingTimers())
        act(() => animations[0].finish())
        act(() => {
            renderer.update(renderSheet({ isVisible: false, onDismiss }))
        })
        const exitAnimation = animations[1]

        act(() => {
            renderer.update(renderSheet({ onDismiss }))
        })
        act(() => jest.runOnlyPendingTimers())
        act(() => animations[2].finish())

        expect(exitAnimation.stop).toHaveBeenCalledTimes(1)
        expect(onDismiss).not.toHaveBeenCalled()
        expect(renderer.root.findByType(Modal).props.visible).toBe(true)
    })
})
