import { act, create } from 'react-test-renderer'
import type { ReactTestRenderer } from 'react-test-renderer'
import { Platform, View } from 'react-native'
import BootSplash from 'react-native-bootsplash'

import { restoreLocalSession } from '../../src/database/localAuth'
import type { User } from '../../src/database'
import { OnboardingScreen } from '../../src/screens/Onboarding/OnboardingScreen'
import { AuthNavigator } from '../../src/navigation/AuthNavigator'
import { AppDrawerNavigator } from '../../src/navigation/AppDrawerNavigator'
import { RootNavigator } from '../../src/navigation/RootNavigator'

jest.mock('@react-navigation/native', () => ({
    NavigationContainer: ({ children }: { children: React.ReactNode }) =>
        children,
    createNavigationContainerRef: () => ({}),
}))
jest.mock('../../src/database/localAuth', () => ({
    restoreLocalSession: jest.fn(),
    logoutLocalUser: jest.fn(),
}))
jest.mock('../../src/screens/Onboarding/OnboardingScreen', () => ({
    OnboardingScreen: () => null,
}))
jest.mock('../../src/navigation/AppDrawerNavigator', () => ({
    AppDrawerNavigator: () => null,
}))
jest.mock('../../src/navigation/AuthNavigator', () => ({
    AuthNavigator: () => null,
}))

describe('RootNavigator splash lifecycle', () => {
    let renderer: ReactTestRenderer

    beforeEach(() => {
        jest.clearAllMocks()
        jest.replaceProperty(Platform, 'OS', 'android')
    })

    afterEach(async () => {
        await act(async () => renderer?.unmount())
        jest.restoreAllMocks()
    })

    it('keeps the splash until session restoration and the initial layout complete', async () => {
        let resolveSession!: (user: User | null) => void
        jest.mocked(restoreLocalSession).mockReturnValue(
            new Promise(resolve => {
                resolveSession = resolve
            }),
        )

        await act(async () => {
            renderer = create(<RootNavigator />)
        })

        const loadingView = renderer.root.findByType(View)
        expect(loadingView.props.onLayout).toBeUndefined()
        expect(BootSplash.hide).not.toHaveBeenCalled()

        await act(async () => resolveSession(null))

        expect(renderer.root.findByType(OnboardingScreen)).toBeDefined()
        const readyView = renderer.root.findByType(View)
        expect(readyView).not.toBe(loadingView)
        expect(BootSplash.hide).not.toHaveBeenCalled()

        await act(async () => readyView.props.onLayout())

        expect(BootSplash.hide).toHaveBeenCalledWith({ fade: true })
    })

    it('reveals onboarding if session restoration fails', async () => {
        jest.mocked(restoreLocalSession).mockRejectedValue(new Error('Storage'))

        await act(async () => {
            renderer = create(<RootNavigator />)
        })

        expect(renderer.root.findByType(OnboardingScreen)).toBeDefined()
        await act(async () => renderer.root.findByType(View).props.onLayout())

        expect(BootSplash.hide).toHaveBeenCalledWith({ fade: true })
    })

    it('reveals the app for an existing session', async () => {
        const user = { id: 'local-user' } as User
        jest.mocked(restoreLocalSession).mockResolvedValue(user)

        await act(async () => {
            renderer = create(<RootNavigator />)
        })

        expect(
            renderer.root.findByType(AppDrawerNavigator).props.currentUser,
        ).toBe(user)
        await act(async () => renderer.root.findByType(View).props.onLayout())

        expect(BootSplash.hide).toHaveBeenCalledWith({ fade: true })
    })

    it('hands the onboarding identity to the registration route in memory', async () => {
        jest.mocked(restoreLocalSession).mockResolvedValue(null)

        await act(async () => {
            renderer = create(<RootNavigator />)
        })
        const identity = { name: 'Ana Silva', mascotName: 'Lua' }

        await act(async () => {
            renderer.root
                .findByType(OnboardingScreen)
                .props.onComplete(identity)
        })

        const authNavigator = renderer.root.findByType(AuthNavigator)
        expect(authNavigator.props.initialRoute).toBe('Register')
        expect(authNavigator.props.registrationIdentity).toEqual(identity)
    })

    it('opens Login directly and clears registration identity for Sign in', async () => {
        jest.mocked(restoreLocalSession).mockResolvedValue(null)

        await act(async () => {
            renderer = create(<RootNavigator />)
        })
        await act(async () => {
            renderer.root.findByType(OnboardingScreen).props.onSignIn()
        })

        const authNavigator = renderer.root.findByType(AuthNavigator)
        expect(authNavigator.props.initialRoute).toBe('Login')
        expect(authNavigator.props.registrationIdentity).toBeUndefined()
    })

    it('starts a fresh root mount at onboarding without the previous identity', async () => {
        jest.mocked(restoreLocalSession).mockResolvedValue(null)

        await act(async () => {
            renderer = create(<RootNavigator />)
        })
        await act(async () => {
            renderer.root.findByType(OnboardingScreen).props.onComplete({
                name: 'Ana Silva',
                mascotName: 'Lua',
            })
        })
        expect(renderer.root.findByType(AuthNavigator)).toBeDefined()

        await act(async () => renderer.unmount())
        await act(async () => {
            renderer = create(<RootNavigator />)
        })

        expect(renderer.root.findByType(OnboardingScreen)).toBeDefined()
        expect(renderer.root.findAllByType(AuthNavigator)).toHaveLength(0)
    })
})
