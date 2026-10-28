import { act, create } from 'react-test-renderer'
import type { ReactTestRenderer } from 'react-test-renderer'

import { OnboardingAnimation } from '../../../src/screens/Onboarding/components/OnboardingAnimation'
import { remindersAnimation } from '../../../src/screens/Onboarding/remindersAnimation'
import {
    welcomingAnimation,
    welcomingEndFrame,
    welcomingIdleStartFrame,
} from '../../../src/screens/Onboarding/welcomingAnimation'

jest.mock('lottie-react-native')

const { playMock: mockPlay } = jest.requireMock<{ playMock: jest.Mock }>(
    'lottie-react-native',
)

const animationSources = {
    2: welcomingAnimation,
    3: require('../../../src/assets/animations/moon_idle_happy.json'),
    4: require('../../../src/assets/animations/moon_rotating.json'),
    5: require('../../../src/assets/animations/moon_habits.json'),
    6: require('../../../src/assets/animations/moon_schedule.json'),
    7: remindersAnimation,
} as const

describe('OnboardingAnimation', () => {
    beforeEach(() => jest.clearAllMocks())

    it.each([3, 4, 5, 6, 7])(
        'plays the animation for onboarding page %i automatically in a loop',
        page => {
            let renderer!: ReactTestRenderer
            act(() => {
                renderer = create(<OnboardingAnimation page={page} />)
            })
            const animation = renderer.root.findByProps({
                testID: 'onboarding-lottie-animation',
            })

            expect(animation.props.autoPlay).toBe(true)
            expect(animation.props.loop).toBe(true)
            expect(animation.props.source).toBe(
                animationSources[page as keyof typeof animationSources],
            )
            expect(animation.props.style).toMatchObject({
                height: expect.any(Number),
                width: expect.any(Number),
            })
            act(() => renderer.unmount())
        },
    )

    it('keeps the same native composition and dimensions when looping idle after welcoming', () => {
        let renderer!: ReactTestRenderer
        act(() => {
            renderer = create(<OnboardingAnimation page={2} />)
        })

        const animation = renderer.root.findByProps({
            testID: 'onboarding-lottie-animation',
        })
        expect(animation.props.source).toBe(animationSources[2])
        expect(animation.props.loop).toBe(false)
        const initialStyle = animation.props.style

        act(() => animation.props.onAnimationFinish(false))

        const idle = renderer.root.findByProps({
            testID: 'onboarding-lottie-animation',
        })
        expect(idle).toBe(animation)
        expect(idle.props.source).toBe(welcomingAnimation)
        expect(idle.props.style).toEqual(initialStyle)
        expect(idle.props.loop).toBe(true)
        expect(mockPlay).toHaveBeenCalledWith(
            welcomingIdleStartFrame,
            welcomingEndFrame - 1,
        )

        act(() => renderer.unmount())
    })

    it('does not start idle on cancellation and replays welcoming when returning to page 2', () => {
        let renderer!: ReactTestRenderer
        act(() => {
            renderer = create(<OnboardingAnimation page={2} />)
        })
        const animation = renderer.root.findByProps({
            testID: 'onboarding-lottie-animation',
        })
        act(() => animation.props.onAnimationFinish(true))
        expect(mockPlay).not.toHaveBeenCalled()
        expect(animation.props.loop).toBe(false)

        act(() => animation.props.onAnimationFinish(false))
        expect(animation.props.loop).toBe(true)
        act(() => renderer.update(<OnboardingAnimation page={3} />))
        act(() => renderer.update(<OnboardingAnimation page={2} />))
        const returningAnimation = renderer.root.findByProps({
            testID: 'onboarding-lottie-animation',
        })
        expect(returningAnimation.props.source).toBe(welcomingAnimation)
        expect(returningAnimation.props.loop).toBe(false)
        expect(returningAnimation.props.autoPlay).toBe(true)

        act(() => renderer.unmount())
    })
})
