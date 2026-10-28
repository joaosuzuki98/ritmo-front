import { act, create } from 'react-test-renderer'
import type { ReactTestRenderer } from 'react-test-renderer'
import { Text, TextInput } from 'react-native'

import { registerLocalUser } from '../../../src/database/localAuth'
import { RegisterScreen } from '../../../src/screens/Register/RegisterScreen'
import type { OnboardingIdentity } from '../../../src/types/onboarding'

jest.mock('../../../src/database/localAuth', () => ({
    registerLocalUser: jest.fn(),
}))

describe('RegisterScreen', () => {
    let renderer: ReactTestRenderer
    const identity: OnboardingIdentity = {
        name: 'Ana Silva',
        mascotName: 'Lua',
    }
    const onBack = jest.fn()
    const onRegisterSuccess = jest.fn()

    const findSubmitButton = () =>
        renderer.root.findByProps({ accessibilityRole: 'button' })

    beforeEach(() => {
        jest.clearAllMocks()
    })

    afterEach(async () => {
        await act(async () => renderer?.unmount())
    })

    it('renders only email and password and includes the onboarding identity in registration', async () => {
        jest.mocked(registerLocalUser).mockResolvedValue({
            id: 'user-1',
        } as never)

        await act(async () => {
            renderer = create(
                <RegisterScreen
                    identity={identity}
                    onBack={onBack}
                    onRegisterSuccess={onRegisterSuccess}
                />,
            )
        })

        const inputs = renderer.root.findAllByType(TextInput)
        const emailInput = renderer.root.findByProps({
            accessibilityLabel: 'E-mail',
        })
        const passwordInput = renderer.root.findByProps({
            accessibilityLabel: 'Senha',
        })
        expect(inputs.map(input => input.props.accessibilityLabel)).toEqual([
            'E-mail',
            'Senha',
        ])
        expect(inputs).toHaveLength(2)
        expect(
            renderer.root.findByProps({
                accessibilityLabel: 'Requisitos da senha',
            }),
        ).toBeTruthy()

        await act(async () => {
            emailInput.props.onChangeText('ana@example.com')
            passwordInput.props.onChangeText('password123!')
        })
        await act(async () => {
            await findSubmitButton().props.onPress()
        })

        expect(registerLocalUser).toHaveBeenCalledWith({
            email: 'ana@example.com',
            password: 'password123!',
            ...identity,
        })
        expect(onRegisterSuccess).toHaveBeenCalled()
    })

    it('keeps the credentials and onboarding identity available after a failed submission', async () => {
        jest.mocked(registerLocalUser).mockRejectedValue(new Error('Offline'))

        await act(async () => {
            renderer = create(
                <RegisterScreen
                    identity={identity}
                    onBack={onBack}
                    onRegisterSuccess={onRegisterSuccess}
                />,
            )
        })
        await act(async () => {
            renderer.root
                .findByProps({ accessibilityLabel: 'E-mail' })
                .props.onChangeText('ana@example.com')
            renderer.root
                .findByProps({ accessibilityLabel: 'Senha' })
                .props.onChangeText('password123!')
        })
        await act(async () => {
            await findSubmitButton().props.onPress()
        })

        expect(
            renderer.root.findByProps({ accessibilityLabel: 'E-mail' }).props
                .value,
        ).toBe('ana@example.com')
        expect(registerLocalUser).toHaveBeenCalledWith({
            email: 'ana@example.com',
            password: 'password123!',
            ...identity,
        })
        expect(
            renderer.root
                .findAllByType(Text)
                .some(node => node.props.children === 'Offline'),
        ).toBe(true)
    })
})
