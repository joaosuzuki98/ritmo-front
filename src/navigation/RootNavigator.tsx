import {
    NavigationContainer,
    createNavigationContainerRef,
} from '@react-navigation/native'
import { useState } from 'react'

import { OnboardingScreen } from '../screens/Onboarding/OnboardingScreen'
import type { RootParamList } from './types'

import { AuthNavigator } from './AuthNavigator'
import { AppDrawerNavigator } from './AppDrawerNavigator'

export const navigationRef = createNavigationContainerRef<RootParamList>()

export const RootNavigator = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false)

    return (
        <NavigationContainer ref={navigationRef}>
            {isAuthenticated ? (
                <AppDrawerNavigator
                    onLogout={() => setIsAuthenticated(false)}
                />
            ) : hasSeenOnboarding ? (
                <AuthNavigator
                    onAuthenticated={() => setIsAuthenticated(true)}
                />
            ) : (
                <OnboardingScreen
                    onComplete={() => setHasSeenOnboarding(true)}
                />
            )}
        </NavigationContainer>
    )
}
