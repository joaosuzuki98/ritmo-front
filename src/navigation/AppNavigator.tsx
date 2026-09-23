import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useState } from 'react'

import { BottomBar } from '../components/BottomBar'
import { HabitsDashboardScreen } from '../screens/HabitsDashboard/HabitsDashboardScreen'
import type { AppTabParamList } from './types'

const Tab = createBottomTabNavigator<AppTabParamList>()

export const AppNavigator = () => {
    const [isAddHabitModalVisible, setIsAddHabitModalVisible] = useState(false)
    const openAddHabitModal = () => setIsAddHabitModalVisible(true)
    const closeAddHabitModal = () => setIsAddHabitModalVisible(false)

    return (
        <Tab.Navigator
            tabBar={props => (
                <BottomBar {...props} onAddHabit={openAddHabitModal} />
            )}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen name="Habits">
                {() => (
                    <HabitsDashboardScreen
                        currentUserId="local-user"
                        isAddHabitModalVisible={isAddHabitModalVisible}
                        onOpenAddHabitModal={openAddHabitModal}
                        onCloseAddHabitModal={closeAddHabitModal}
                    />
                )}
            </Tab.Screen>
            <Tab.Screen name="Schedule">
                {() => (
                    <HabitsDashboardScreen
                        currentUserId="local-user"
                        isAddHabitModalVisible={isAddHabitModalVisible}
                        onOpenAddHabitModal={openAddHabitModal}
                        onCloseAddHabitModal={closeAddHabitModal}
                    />
                )}
            </Tab.Screen>
            <Tab.Screen name="Reminders">
                {() => (
                    <HabitsDashboardScreen
                        currentUserId="local-user"
                        isAddHabitModalVisible={isAddHabitModalVisible}
                        onOpenAddHabitModal={openAddHabitModal}
                        onCloseAddHabitModal={closeAddHabitModal}
                    />
                )}
            </Tab.Screen>
            <Tab.Screen name="Todo">
                {() => (
                    <HabitsDashboardScreen
                        currentUserId="local-user"
                        isAddHabitModalVisible={isAddHabitModalVisible}
                        onOpenAddHabitModal={openAddHabitModal}
                        onCloseAddHabitModal={closeAddHabitModal}
                    />
                )}
            </Tab.Screen>
        </Tab.Navigator>
    )
}
