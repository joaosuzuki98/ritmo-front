import { createDrawerNavigator } from '@react-navigation/drawer'
import type { DrawerContentComponentProps } from '@react-navigation/drawer'
import { useCallback } from 'react'

import type { User } from '../database'
import { colors } from '../styles/colors'
import { AppDrawerContent } from './AppDrawerContent'
import { AppDrawerLogoutContext } from './AppDrawerLogoutContext'
import { AppNavigator } from './AppNavigator'
import type { RootParamList } from './types'

type AppDrawerNavigatorProps = {
    currentUser: User
    onLogout: () => void
}

const Drawer = createDrawerNavigator<RootParamList>()

export const AppDrawerNavigator = ({
    currentUser,
    onLogout,
}: AppDrawerNavigatorProps) => {
    const renderDrawerContent = useCallback(
        (props: DrawerContentComponentProps) => (
            <AppDrawerContent {...props} currentUser={currentUser} />
        ),
        [currentUser],
    )

    return (
        <AppDrawerLogoutContext.Provider value={onLogout}>
            <Drawer.Navigator
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
                    {() => <AppNavigator currentUser={currentUser} />}
                </Drawer.Screen>
            </Drawer.Navigator>
        </AppDrawerLogoutContext.Provider>
    )
}
