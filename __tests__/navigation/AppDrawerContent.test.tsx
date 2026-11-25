import type { DrawerContentComponentProps } from '@react-navigation/drawer'
import { act, create } from 'react-test-renderer'
import type { ReactTestRenderer } from 'react-test-renderer'

import type { User } from '../../src/database'
import { useLanguageStore } from '../../src/localization/useLanguageStore'
import { AppDrawerContent } from '../../src/navigation/AppDrawerContent'

jest.mock('@react-navigation/drawer', () => ({
    DrawerContentScrollView: ({ children }: { children: React.ReactNode }) => {
        const { View } = require('react-native')
        return <View>{children}</View>
    },
}))
jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

describe('AppDrawerContent', () => {
    let renderer: ReactTestRenderer
    const navigation = { closeDrawer: jest.fn(), navigate: jest.fn() }
    const user = { name: 'Ana', email: 'ana@example.com' } as User

    const renderDrawer = (drawerRoute: string, tabRoute: string) => {
        const props = {
            navigation,
            state: {
                index: drawerRoute === 'Main' ? 0 : 1,
                routes: [
                    {
                        name: 'Main',
                        state: { index: 0, routes: [{ name: tabRoute }] },
                    },
                    { name: drawerRoute },
                ],
            },
        } as unknown as DrawerContentComponentProps
        act(() => {
            renderer = create(
                <AppDrawerContent {...props} currentUser={user} />,
            )
        })
    }

    beforeEach(() => {
        jest.clearAllMocks()
        useLanguageStore.setState({ language: 'en' })
    })

    afterEach(() => {
        act(() => renderer?.unmount())
        useLanguageStore.setState({ language: 'en' })
    })

    it.each([
        ['Main', 'Settings'],
        ['AskTheStars', 'Habits'],
        ['StartYourDay', 'Habits'],
    ])('opens habits from %s', (drawerRoute, tabRoute) => {
        renderDrawer(drawerRoute, tabRoute)
        const home = renderer.root.findByProps({ accessibilityLabel: 'Home' })
        expect(home.props.accessibilityState).toEqual({
            disabled: false,
            selected: false,
        })

        act(() => home.props.onPress())

        expect(navigation.closeDrawer).toHaveBeenCalledTimes(1)
        expect(navigation.navigate).toHaveBeenCalledWith('Main', {
            screen: 'Habits',
        })
    })

    it('marks Home as selected on the habits screen', () => {
        renderDrawer('Main', 'Habits')
        expect(
            renderer.root.findByProps({ accessibilityLabel: 'Home' }).props
                .accessibilityState.selected,
        ).toBe(true)
    })

    it('translates Home to Portuguese', () => {
        useLanguageStore.setState({ language: 'pt' })
        renderDrawer('Main', 'Habits')
        expect(
            renderer.root.findByProps({ accessibilityLabel: 'Início' }).props
                .accessibilityState.selected,
        ).toBe(true)
    })
})
