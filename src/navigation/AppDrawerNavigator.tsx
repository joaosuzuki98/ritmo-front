import { createDrawerNavigator } from '@react-navigation/drawer'

import { colors } from '../styles/colors'
import { AppDrawerContent } from './AppDrawerContent'
import { AppDrawerLogoutContext } from './AppDrawerLogoutContext'
import { AppNavigator } from './AppNavigator'
import type { RootParamList } from './types'

type AppDrawerNavigatorProps = {
    onLogout: () => void
}

const Drawer = createDrawerNavigator<RootParamList>()

export const AppDrawerNavigator = ({ onLogout }: AppDrawerNavigatorProps) => {
    return (
        <AppDrawerLogoutContext.Provider value={onLogout}>
            <Drawer.Navigator
                drawerContent={AppDrawerContent}
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
                <Drawer.Screen component={AppNavigator} name="Main" />
            </Drawer.Navigator>
        </AppDrawerLogoutContext.Provider>
    )
}
