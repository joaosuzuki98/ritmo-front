import { useState } from 'react'

import { ForgotPasswordScreen } from '../screens/ForgotPassword/ForgotPasswordScreen'
import { LoginScreen } from '../screens/Login/LoginScreen'
import { RegisterScreen } from '../screens/Register/RegisterScreen'

type AuthRoute = 'Login' | 'Register' | 'ForgotPassword'

type AuthNavigatorProps = {
    onAuthenticated: () => void
}

export const AuthNavigator = ({ onAuthenticated }: AuthNavigatorProps) => {
    const [route, setRoute] = useState<AuthRoute>('Login')

    if (route === 'Register') {
        return (
            <RegisterScreen
                onBack={() => setRoute('Login')}
                onRegisterSuccess={onAuthenticated}
            />
        )
    }

    if (route === 'ForgotPassword') {
        return <ForgotPasswordScreen onBack={() => setRoute('Login')} />
    }

    return (
        <LoginScreen
            onForgotPasswordPress={() => setRoute('ForgotPassword')}
            onLoginSuccess={onAuthenticated}
            onRegisterPress={() => setRoute('Register')}
        />
    )
}
