import {
    NavigationContainer,
    createNavigationContainerRef,
} from '@react-navigation/native'
import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import type { User } from '../database'
import { logoutLocalUser, restoreLocalSession } from '../database/localAuth'
import { OnboardingScreen } from '../screens/Onboarding/OnboardingScreen'
import { colors } from '../styles/colors'
import type { RootParamList } from './types'

import { AuthNavigator } from './AuthNavigator'
import { AppDrawerNavigator } from './AppDrawerNavigator'

export const navigationRef = createNavigationContainerRef<RootParamList>()

export const RootNavigator = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null)
    const [isRestoringSession, setIsRestoringSession] = useState(true)
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false)

    useEffect(() => {
        restoreLocalSession()
            .then(setCurrentUser)
            .catch(() => setCurrentUser(null))
            .finally(() => setIsRestoringSession(false))
    }, [])

    const handleLogout = async () => {
        if (currentUser) {
            await logoutLocalUser(currentUser.id).catch(() => null)
        }
        setCurrentUser(null)
    }

    if (isRestoringSession) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator color={colors.onboardingPurple} />
            </View>
        )
    }

    return (
        <NavigationContainer ref={navigationRef}>
            {currentUser ? (
                <AppDrawerNavigator
                    currentUser={currentUser}
                    onLogout={handleLogout}
                />
            ) : hasSeenOnboarding ? (
                <AuthNavigator onAuthenticated={setCurrentUser} />
            ) : (
                <OnboardingScreen
                    onComplete={() => setHasSeenOnboarding(true)}
                />
            )}
        </NavigationContainer>
    )
}

const styles = StyleSheet.create({
    loading: {
        alignItems: 'center',
        backgroundColor: colors.onboardingBackground,
        flex: 1,
        justifyContent: 'center',
    },
})
