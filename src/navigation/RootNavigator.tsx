import notifee, { EventType } from '@notifee/react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
    ActivityIndicator,
    AppState,
    Platform,
    StyleSheet,
    View,
} from 'react-native'
import {
    NavigationContainer,
    createNavigationContainerRef,
} from '@react-navigation/native'
import BootSplash from 'react-native-bootsplash'

import type { User } from '../database'
import { logoutUser, restoreLocalSession } from '../services/auth'
import { OnboardingScreen } from '../screens/Onboarding/OnboardingScreen'
import { colors } from '../styles/colors'
import { consumePendingHabitAnalysis } from '../notifications/localNotificationEvents'
import type { OnboardingIdentity } from '../types/onboarding'
import type { RootParamList } from './types'

import { AuthNavigator } from './AuthNavigator'
import type { AuthInitialRoute } from './AuthNavigator'
import { AppDrawerNavigator } from './AppDrawerNavigator'

export const navigationRef = createNavigationContainerRef<RootParamList>()

export const RootNavigator = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null)
    const [isRestoringSession, setIsRestoringSession] = useState(true)
    const [authInitialRoute, setAuthInitialRoute] =
        useState<AuthInitialRoute | null>(null)
    const [registrationIdentity, setRegistrationIdentity] =
        useState<OnboardingIdentity>()
    const currentUserId = currentUser?.id
    const currentUserIdRef = useRef(currentUserId)
    currentUserIdRef.current = currentUserId
    const pendingHabitAnalysis = useRef<{
        habitId: string
        userId?: string
    } | null>(null)

    const dispatchPendingHabitAnalysis = useCallback(() => {
        const pending = pendingHabitAnalysis.current
        if (!pending || !currentUserIdRef.current || !navigationRef.isReady())
            return

        pendingHabitAnalysis.current = null
        if (pending.userId && pending.userId !== currentUserIdRef.current)
            return

        navigationRef.navigate('AskTheStars', { habitId: pending.habitId })
    }, [])

    const openHabitAnalysis = useCallback(
        (habitId: string, notificationUserId?: string) => {
            const activeUserId = currentUserIdRef.current
            if (
                activeUserId &&
                notificationUserId &&
                notificationUserId !== activeUserId
            )
                return

            if (!activeUserId || !navigationRef.isReady()) {
                pendingHabitAnalysis.current = {
                    habitId,
                    ...(notificationUserId
                        ? { userId: notificationUserId }
                        : {}),
                }
                return
            }

            const currentRoute = navigationRef.getCurrentRoute()
            const currentParams = currentRoute?.params as
                | { habitId?: string }
                | undefined
            if (
                currentRoute?.name === 'AskTheStars' &&
                currentParams?.habitId === habitId
            )
                return

            navigationRef.navigate('AskTheStars', { habitId })
        },
        [],
    )

    useEffect(() => {
        dispatchPendingHabitAnalysis()
    }, [currentUserId, dispatchPendingHabitAnalysis])

    useEffect(() => {
        const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
            if (type !== EventType.PRESS) return
            const data = detail.notification?.data
            if (
                data?.type === 'low_success_habit' &&
                typeof data.habitId === 'string'
            )
                openHabitAnalysis(
                    data.habitId,
                    typeof data.userId === 'string' ? data.userId : undefined,
                )
        })

        notifee
            .getInitialNotification()
            .then(initialNotification => {
                const data = initialNotification?.notification.data
                if (
                    data?.type === 'low_success_habit' &&
                    typeof data.habitId === 'string'
                )
                    openHabitAnalysis(
                        data.habitId,
                        typeof data.userId === 'string'
                            ? data.userId
                            : undefined,
                    )
            })
            .catch(() => undefined)

        return unsubscribe
    }, [openHabitAnalysis])

    useEffect(() => {
        const userId = currentUser?.id
        if (!userId) return
        let isActive = true

        const openPendingHabitAnalysis = async () => {
            const habitId = await consumePendingHabitAnalysis(userId)
            if (isActive && habitId) openHabitAnalysis(habitId, userId)
        }

        openPendingHabitAnalysis().catch(() => undefined)
        const appStateSubscription = AppState.addEventListener(
            'change',
            state => {
                if (state === 'active')
                    openPendingHabitAnalysis().catch(() => undefined)
            },
        )

        return () => {
            isActive = false
            appStateSubscription.remove()
        }
    }, [currentUser?.id, openHabitAnalysis])

    useEffect(() => {
        restoreLocalSession()
            .then(setCurrentUser)
            .catch(() => setCurrentUser(null))
            .finally(() => setIsRestoringSession(false))
    }, [])

    const handleLogout = async () => {
        if (currentUser) {
            await logoutUser(currentUser.id).catch(() => null)
        }
        setCurrentUser(null)
        setRegistrationIdentity(undefined)
        setAuthInitialRoute('Login')
    }

    const handleAuthenticated = (user: User) => {
        setRegistrationIdentity(undefined)
        setCurrentUser(user)
    }

    const handleStartRegistration = () => {
        setRegistrationIdentity(undefined)
        setAuthInitialRoute(null)
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
            <NavigationContainer
                onReady={() => {
                    dispatchPendingHabitAnalysis()
                }}
                ref={navigationRef}
            >
                {currentUser ? (
                    <AppDrawerNavigator
                        key={currentUser.id}
                        currentUser={currentUser}
                        onLogout={handleLogout}
                    />
                ) : authInitialRoute ? (
                    <AuthNavigator
                        initialRoute={authInitialRoute}
                        onAuthenticated={handleAuthenticated}
                        onStartRegistration={handleStartRegistration}
                        registrationIdentity={registrationIdentity}
                    />
                ) : (
                    <OnboardingScreen
                        onComplete={identity => {
                            setRegistrationIdentity(identity)
                            setAuthInitialRoute('Register')
                        }}
                        onSignIn={() => {
                            setRegistrationIdentity(undefined)
                            setAuthInitialRoute('Login')
                        }}
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
