import { useEffect, useState } from 'react'
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native'
import {
    NavigationContainer,
    createNavigationContainerRef,
} from '@react-navigation/native'
import BootSplash from 'react-native-bootsplash'

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

    const handleInitialLayout = async () => {
        if (Platform.OS === 'android') {
            await BootSplash.hide({ fade: true })
        }
    }

    if (isRestoringSession) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator color={colors.onboardingPurple} />
            </View>
        )
    }

    return (
        // A new native view guarantees a layout event after session restoration.
        <View key="ready" className="flex-1" onLayout={handleInitialLayout}>
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
        </View>
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
