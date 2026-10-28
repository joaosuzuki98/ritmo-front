import { act, create } from 'react-test-renderer'
import type { ReactTestRenderer } from 'react-test-renderer'
import { Text, TextInput } from 'react-native'

import { registerLocalUser } from '../../../src/database/localAuth'
import { AuthScreenLayout } from '../../../src/components/AuthScreenLayout/AuthScreenLayout'
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
            accessibilityLabel: 'Email',
        })
        const passwordInput = renderer.root.findByProps({
            accessibilityLabel: 'Password',
        })
        expect(inputs.map(input => input.props.accessibilityLabel)).toEqual([
            'Email',
            'Password',
        ])
        expect(inputs).toHaveLength(2)
        expect(
            renderer.root.findByProps({
                accessibilityLabel: 'Password requirements',
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

    it('includes the requirements in the keyboard safe area only while the password is focused', async () => {
        await act(async () => {
            renderer = create(
                <RegisterScreen
                    identity={identity}
                    onBack={onBack}
                    onRegisterSuccess={onRegisterSuccess}
                />,
            )
        })

        const layout = renderer.root.findByType(AuthScreenLayout)
        const password = renderer.root.findByProps({
            accessibilityLabel: 'Password',
        })
        expect(layout.props.keyboardRevealRef).toBeUndefined()
        await act(async () => password.props.onFocus())
        expect(layout.props.keyboardRevealRef).toBeDefined()
        await act(async () => password.props.onBlur())
        expect(layout.props.keyboardRevealRef).toBeUndefined()
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
                .findByProps({ accessibilityLabel: 'Email' })
                .props.onChangeText('ana@example.com')
            renderer.root
                .findByProps({ accessibilityLabel: 'Password' })
                .props.onChangeText('password123!')
        })
        await act(async () => {
            await findSubmitButton().props.onPress()
        })

        expect(
            renderer.root.findByProps({ accessibilityLabel: 'Email' }).props
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
