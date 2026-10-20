import { act, create } from 'react-test-renderer'
import type { ReactTestRenderer } from 'react-test-renderer'
import Sound from 'react-native-sound'

import { OnboardingScreen } from '../../../src/screens/Onboarding/OnboardingScreen'

jest.mock('lottie-react-native')

describe('OnboardingScreen', () => {
    let renderer: ReactTestRenderer
    let onComplete: jest.Mock
    let onSignIn: jest.Mock

    const press = async (accessibilityLabel: string) => {
        await act(async () => {
            renderer.root.findByProps({ accessibilityLabel }).props.onPress()
        })
    }

    const enterText = async (accessibilityLabel: string, value: string) => {
        await act(async () => {
            renderer.root
                .findByProps({ accessibilityLabel })
                .props.onChangeText(value)
        })
    }

    const textFor = (accessibilityLabel: string) =>
        renderer.root.findByProps({ accessibilityLabel }).props.children

    beforeEach(() => {
        jest.clearAllMocks()
        onComplete = jest.fn()
        onSignIn = jest.fn()
    })

    afterEach(async () => {
        await act(async () => renderer?.unmount())
        jest.restoreAllMocks()
    })

    it('offers Continue and Sign in from the entry page', async () => {
        await act(async () => {
            renderer = create(
                <OnboardingScreen
                    onComplete={onComplete}
                    onSignIn={onSignIn}
                />,
            )
        })

        expect(textFor('Onboarding welcome')).toBe('Bem-vindo(a)')
        expect(
            renderer.root.findByProps({
                accessibilityLabel: 'Continue onboarding',
            }),
        ).toBeDefined()
        expect(
            renderer.root.findByProps({ accessibilityLabel: 'Sign in' }),
        ).toBeDefined()

        await press('Sign in')
        expect(onSignIn).toHaveBeenCalledTimes(1)
    })

    it('shows the six Figma onboarding pages in order and retains both names', async () => {
        await act(async () => {
            renderer = create(
                <OnboardingScreen
                    onComplete={onComplete}
                    onSignIn={onSignIn}
                />,
            )
        })

        await press('Continue onboarding')
        expect(textFor('Onboarding copy page 2')).toContain(
            "Hello, I'll be your assistant on this journey.",
        )
        await enterText('Mascot name', 'Lua')
        await press('Next onboarding page')

        expect(textFor('Onboarding copy page 3')).toContain(
            'And what about you?',
        )
        await enterText('Your name', 'Ana Silva')
        await press('Next onboarding page')

        expect(textFor('Onboarding copy page 4')).toContain(
            'Great! Now let me show you',
        )
        await press('Next onboarding page')
        expect(textFor('Onboarding copy page 5')).toContain(
            'Crie hábitos, organize-os em grupos',
        )
        await press('Next onboarding page')
        expect(textFor('Onboarding copy page 6')).toContain(
            'Monte seu dia em uma linha do tempo',
        )
        await press('Next onboarding page')
        expect(textFor('Onboarding copy page 7')).toContain(
            'E não é só sobre hábitos!',
        )
        expect(
            renderer.root.findByProps({
                accessibilityLabel: 'Onboarding progress, page 6 of 6',
            }),
        ).toBeDefined()

        await press('Create account')
        expect(onComplete).toHaveBeenCalledWith({
            name: 'Ana Silva',
            mascotName: 'Lua',
        })
    })

    it('requires a nonblank mascot name and retains entered values when navigating back', async () => {
        await act(async () => {
            renderer = create(
                <OnboardingScreen
                    onComplete={onComplete}
                    onSignIn={onSignIn}
                />,
            )
        })

        await press('Continue onboarding')
        await press('Next onboarding page')
        expect(textFor('Mascot name error')).toBe(
            'Informe um nome para o mascote.',
        )

        await enterText('Mascot name', 'Lua')
        await press('Next onboarding page')
        await enterText('Your name', 'Ana Silva')
        await press('Back to previous onboarding page')
        expect(
            renderer.root.findByProps({ accessibilityLabel: 'Mascot name' })
                .props.value,
        ).toBe('Lua')
    })

    it('preserves the existing looping-music lifecycle', async () => {
        const category = jest.spyOn(Sound, 'setCategory')
        const loop = jest.spyOn(Sound.prototype, 'setNumberOfLoops')
        const play = jest.spyOn(Sound.prototype, 'play')
        const stop = jest.spyOn(Sound.prototype, 'stop')
        const release = jest.spyOn(Sound.prototype, 'release')

        await act(async () => {
            renderer = create(
                <OnboardingScreen
                    onComplete={onComplete}
                    onSignIn={onSignIn}
                />,
            )
            await Promise.resolve()
        })

        expect(category).toHaveBeenCalledWith('Playback')
        expect(loop).toHaveBeenCalledWith(-1)
        expect(play).toHaveBeenCalled()

        await act(async () => renderer.unmount())
        expect(stop).toHaveBeenCalled()
        expect(release).toHaveBeenCalled()
    })
})
