import {
    NavigationContainer,
    createNavigationContainerRef,
} from '@react-navigation/native'
import { useState } from 'react'

import type { RootParamList } from './types'

import { AppNavigator } from './AppNavigator'
import { AuthNavigator } from './AuthNavigator'

export const navigationRef = createNavigationContainerRef<RootParamList>()

export const RootNavigator = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    return (
        <NavigationContainer ref={navigationRef}>
            {isAuthenticated ? (
                <AppNavigator />
            ) : (
                <AuthNavigator
                    onAuthenticated={() => setIsAuthenticated(true)}
                />
            )}
        </NavigationContainer>
    )
}
