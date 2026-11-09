import { act, create } from 'react-test-renderer'
import type { ReactTestRenderer } from 'react-test-renderer'
import { Animated } from 'react-native'

import { AnimatedStarMessage } from '../../../src/screens/AskTheStars/components/AnimatedStarMessage'

jest.mock('@react-navigation/native', () => ({
    useFocusEffect: (effect: () => void | (() => void)) => {
        require('react').useEffect(effect, [effect])
    },
}))

describe('AnimatedStarMessage completion', () => {
    let renderer: ReactTestRenderer
    let complete: ((result: { finished: boolean }) => void) | undefined
    const stop = jest.fn()

    beforeEach(() => {
        jest.spyOn(Animated, 'timing').mockImplementation(() => ({
            start: callback => {
                complete = callback
            },
            stop,
            reset: jest.fn(),
        }))
    })

    afterEach(() => {
        act(() => renderer.unmount())
        jest.restoreAllMocks()
    })

    it('reports completion only when the animation finishes successfully', () => {
        const onAnimationComplete = jest.fn()
        act(() => {
            renderer = create(
                <AnimatedStarMessage
                    message="Hello"
                    onAnimationComplete={onAnimationComplete}
                />,
            )
        })
        expect(onAnimationComplete).not.toHaveBeenCalled()
        act(() => complete?.({ finished: false }))
        expect(onAnimationComplete).not.toHaveBeenCalled()
        act(() => complete?.({ finished: true }))
        expect(onAnimationComplete).toHaveBeenCalledTimes(1)
    })

    it('ignores a late completion from a replaced message', () => {
        const onAnimationComplete = jest.fn()
        act(() => {
            renderer = create(
                <AnimatedStarMessage
                    message="First"
                    onAnimationComplete={onAnimationComplete}
                />,
            )
        })
        const previousComplete = complete
        act(() =>
            renderer.update(
                <AnimatedStarMessage
                    message="Second"
                    onAnimationComplete={onAnimationComplete}
                />,
            ),
        )
        act(() => previousComplete?.({ finished: true }))
        expect(onAnimationComplete).not.toHaveBeenCalled()
        act(() => complete?.({ finished: true }))
        expect(onAnimationComplete).toHaveBeenCalledTimes(1)
    })
})
