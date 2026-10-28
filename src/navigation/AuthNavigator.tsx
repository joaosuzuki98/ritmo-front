import { useState } from 'react'

import type { User } from '../database'
import type { OnboardingIdentity } from '../types/onboarding'
import { ForgotPasswordScreen } from '../screens/ForgotPassword/ForgotPasswordScreen'
import { LoginScreen } from '../screens/Login/LoginScreen'
import { RegisterScreen } from '../screens/Register/RegisterScreen'

type AuthRoute = 'Login' | 'Register' | 'ForgotPassword'
export type AuthInitialRoute = Extract<AuthRoute, 'Login' | 'Register'>

type AuthNavigatorProps = {
    initialRoute: AuthInitialRoute
    onStartRegistration: () => void
    onAuthenticated: (user: User) => void
    registrationIdentity?: OnboardingIdentity
}

export const AuthNavigator = ({
    initialRoute,
    onStartRegistration,
    onAuthenticated,
    registrationIdentity,
}: AuthNavigatorProps) => {
    const [route, setRoute] = useState<AuthRoute>(initialRoute)

    if (route === 'Register' && registrationIdentity) {
        return (
            <RegisterScreen
                identity={registrationIdentity}
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
            onRegisterPress={() =>
                registrationIdentity
                    ? setRoute('Register')
                    : onStartRegistration()
            }
        />
    )
}
