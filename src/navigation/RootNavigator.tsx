import {
    NavigationContainer,
    createNavigationContainerRef,
} from '@react-navigation/native'
import { useState } from 'react'

import type { RootParamList } from './types'

import { AuthNavigator } from './AuthNavigator'
import { AppDrawerNavigator } from './AppDrawerNavigator'

export const navigationRef = createNavigationContainerRef<RootParamList>()

export const RootNavigator = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    return (
        <NavigationContainer ref={navigationRef}>
            {isAuthenticated ? (
                <AppDrawerNavigator
                    onLogout={() => setIsAuthenticated(false)}
                />
            ) : (
                <AuthNavigator
                    onAuthenticated={() => setIsAuthenticated(true)}
                />
            )}
        </NavigationContainer>
    )
}
