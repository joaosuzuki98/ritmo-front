import { createDrawerNavigator } from '@react-navigation/drawer'
import type { DrawerContentComponentProps } from '@react-navigation/drawer'
import { useCallback, useEffect } from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'

import { API_BASE_URL } from '../constants/api'
import { createSyncManager } from '../database/sync'
import type { User } from '../database'
import { StartYourDayScreen } from '../screens/StartYourDay/StartYourDayScreen'
import { AskTheStarsScreen } from '../screens/AskTheStars/AskTheStarsScreen'
import { colors } from '../styles/colors'
import { AppDrawerContent } from './AppDrawerContent'
import { AppDrawerLogoutContext } from './AppDrawerLogoutContext'
import { AppNavigator } from './AppNavigator'
import type { RootParamList } from './types'
import { useDailyAccess } from './useDailyAccess'
import { startLocalReminderManager } from '../notifications/localNotifications'
import { useTranslation } from '../localization/useTranslation'

type AppDrawerNavigatorProps = {
    currentUser: User
    onLogout: () => void
}

const Drawer = createDrawerNavigator<RootParamList>()

export const AppDrawerNavigator = ({
    currentUser,
    onLogout,
}: AppDrawerNavigatorProps) => {
    const { t } = useTranslation()
    useEffect(() => {
        const syncManager = createSyncManager({
            baseUrl: API_BASE_URL,
            onError: error =>
                console.warn(
                    'Database synchronization failed',
                    error instanceof Error ? error.message : 'Unknown error',
                ),
        })
        syncManager.start()

        return syncManager.stop
    }, [currentUser.id])

    useEffect(() => startLocalReminderManager(currentUser.id), [currentUser.id])

    const { access, hasError, finishStart, retry } = useDailyAccess(
        currentUser.id,
    )
    const renderDrawerContent = useCallback(
        (props: DrawerContentComponentProps) => (
            <AppDrawerContent {...props} currentUser={currentUser} />
        ),
        [currentUser],
    )

    if (hasError || !access) {
        return (
            <View
                className="flex-1 items-center justify-center"
                style={{ backgroundColor: colors.background }}
            >
                {hasError ? (
                    <Pressable accessibilityRole="button" onPress={retry}>
                        <Text className="text-white">
                            {t('Unable to load today. Tap to retry.')}
                        </Text>
                    </Pressable>
                ) : (
                    <ActivityIndicator color={colors.onboardingPurple} />
                )}
            </View>
        )
    }

    return (
        <AppDrawerLogoutContext.Provider value={onLogout}>
            <Drawer.Navigator
                key={access.date}
                initialRouteName={
                    access.shouldShowStart ? 'StartYourDay' : 'Main'
                }
                drawerContent={renderDrawerContent}
                screenOptions={{
                    drawerPosition: 'right',
                    drawerStyle: {
                        backgroundColor: colors.surface,
                        width: 300,
                    },
                    drawerType: 'front',
                    headerShown: false,
                    overlayColor: 'rgba(0, 0, 0, 0.62)',
                    sceneStyle: { backgroundColor: colors.background },
                    swipeEdgeWidth: 48,
                }}
            >
                <Drawer.Screen name="Main">
                    {() => (
                        <AppNavigator
                            currentUser={currentUser}
                            totalAccessDays={access.totalAccessDays}
                        />
                    )}
                </Drawer.Screen>
                {access.shouldShowStart ? (
                    <Drawer.Screen
                        name="StartYourDay"
                        listeners={{ blur: finishStart }}
                    >
                        {({ navigation }) => (
                            <StartYourDayScreen
                                currentUser={currentUser}
                                dayNumber={access.totalAccessDays}
                                onMenuPress={() => navigation.openDrawer()}
                                onContinue={finishStart}
                            />
                        )}
                    </Drawer.Screen>
                ) : null}
                <Drawer.Screen name="AskTheStars">
                    {({ navigation, route }) => (
                        <AskTheStarsScreen
                            currentUser={currentUser}
                            initialHabitId={route.params?.habitId}
                            isWeeklyLoadAnalysis={
                                route.params?.mode === 'weeklyLoad'
                            }
                            onClose={() => {
                                if (navigation.canGoBack()) {
                                    navigation.goBack()
                                    return
                                }

                                navigation.navigate('Main', {
                                    screen: 'Habits',
                                })
                            }}
                            onMenuPress={() => navigation.openDrawer()}
                            onScheduleAccepted={weekDay =>
                                navigation.navigate('Main', {
                                    screen: 'Habits',
                                    params: { weekDay },
                                })
                            }
                            totalAccessDays={access.totalAccessDays}
                        />
                    )}
                </Drawer.Screen>
            </Drawer.Navigator>
        </AppDrawerLogoutContext.Provider>
    )
}
