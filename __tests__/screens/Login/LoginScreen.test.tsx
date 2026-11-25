import { act, create } from 'react-test-renderer'
import type { ReactTestRenderer } from 'react-test-renderer'
import { Text } from 'react-native'

import { useLanguageStore } from '../../../src/localization/useLanguageStore'
import { LoginScreen } from '../../../src/screens/Login/LoginScreen'
import { authenticateUser } from '../../../src/services/auth'

jest.mock('../../../src/services/auth', () => ({
    authenticateUser: jest.fn(),
}))

describe('LoginScreen', () => {
    let renderer: ReactTestRenderer

    afterEach(async () => {
        await act(async () => renderer?.unmount())
        useLanguageStore.setState({ language: 'en' })
        jest.clearAllMocks()
    })

    it('shows the generic translated message for invalid credentials', async () => {
        useLanguageStore.setState({ language: 'pt' })
        jest.mocked(authenticateUser).mockRejectedValue(
            new Error('Incorrect login details.'),
        )

        await act(async () => {
            renderer = create(
                <LoginScreen
                    onForgotPasswordPress={jest.fn()}
                    onLoginSuccess={jest.fn()}
                    onRegisterPress={jest.fn()}
                />,
            )
        })
        await act(async () => {
            renderer.root
                .findByProps({ accessibilityLabel: 'E-mail' })
                .props.onChangeText('person@example.com')
            renderer.root
                .findByProps({ accessibilityLabel: 'Senha' })
                .props.onChangeText('wrong-password')
        })
        const submit = renderer.root
            .findAllByProps({ accessibilityRole: 'button' })
            .find(button => button.props.accessibilityLabel === undefined)
        await act(async () => submit?.props.onPress())

        expect(
            renderer.root
                .findAllByType(Text)
                .some(
                    node =>
                        node.props.children === 'Dados de acesso incorretos.',
                ),
        ).toBe(true)
    })
})
