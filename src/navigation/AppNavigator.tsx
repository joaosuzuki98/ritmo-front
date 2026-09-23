import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

import { BottomBar } from '../components/BottomBar'
import { HabitsDashboardScreen } from '../screens/HabitsDashboard/HabitsDashboardScreen'
import type { AppTabParamList } from './types'

const Tab = createBottomTabNavigator<AppTabParamList>()

export const AppNavigator = () => {
    return (
        <Tab.Navigator
            tabBar={props => <BottomBar {...props} />}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen name="Habits">
                {() => <HabitsDashboardScreen currentUserId="local-user" />}
            </Tab.Screen>
            <Tab.Screen name="Schedule">
                {() => <HabitsDashboardScreen currentUserId="local-user" />}
            </Tab.Screen>
            <Tab.Screen name="Reminders">
                {() => <HabitsDashboardScreen currentUserId="local-user" />}
            </Tab.Screen>
            <Tab.Screen name="Todo">
                {() => <HabitsDashboardScreen currentUserId="local-user" />}
            </Tab.Screen>
        </Tab.Navigator>
    )
}
