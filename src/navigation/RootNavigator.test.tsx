import { act, create } from 'react-test-renderer'
import type { ReactTestRenderer } from 'react-test-renderer'
import { Platform, View } from 'react-native'
import BootSplash from 'react-native-bootsplash'

import { restoreLocalSession } from '../database/localAuth'
import type { User } from '../database'
import { OnboardingScreen } from '../screens/Onboarding/OnboardingScreen'
import { AppDrawerNavigator } from './AppDrawerNavigator'
import { RootNavigator } from './RootNavigator'

jest.mock('@react-navigation/native', () => ({
    NavigationContainer: ({ children }: { children: React.ReactNode }) =>
        children,
    createNavigationContainerRef: () => ({}),
}))
jest.mock('../database/localAuth', () => ({
    restoreLocalSession: jest.fn(),
    logoutLocalUser: jest.fn(),
}))
jest.mock('../screens/Onboarding/OnboardingScreen', () => ({
    OnboardingScreen: () => null,
}))
jest.mock('./AppDrawerNavigator', () => ({
    AppDrawerNavigator: () => null,
}))
jest.mock('./AuthNavigator', () => ({
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
})
