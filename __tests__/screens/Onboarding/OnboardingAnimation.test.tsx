import { act, create } from 'react-test-renderer'
import type { ReactTestRenderer } from 'react-test-renderer'

import { OnboardingAnimation } from '../../../src/screens/Onboarding/components/OnboardingAnimation'

jest.mock('lottie-react-native')

const animationSources = {
    2: require('../../../src/assets/animations/moon_welcoming.json'),
    3: require('../../../src/assets/animations/moon_idle_happy.json'),
    4: require('../../../src/assets/animations/moon_rotating.json'),
    5: require('../../../src/assets/animations/moon_habits.json'),
    6: require('../../../src/assets/animations/moon_schedule.json'),
    7: require('../../../src/assets/animations/moon_reminders_and_todo.json'),
} as const

describe('OnboardingAnimation', () => {
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

    it('plays welcoming once, then loops idle happy on onboarding page 2', () => {
        let renderer!: ReactTestRenderer
        act(() => {
            renderer = create(<OnboardingAnimation page={2} />)
        })

        let animation = renderer.root.findByProps({
            testID: 'onboarding-lottie-animation',
        })
        expect(animation.props.source).toBe(animationSources[2])
        expect(animation.props.loop).toBe(false)

        act(() => animation.props.onAnimationFinish(false))

        animation = renderer.root.findByProps({
            testID: 'onboarding-lottie-animation',
        })
        expect(animation.props.source).toBe(animationSources[3])
        expect(animation.props.loop).toBe(true)

        act(() => renderer.unmount())
    })
})
