import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useState } from 'react'

import { BottomBar } from '../components/BottomBar'
import { HabitsDashboardScreen } from '../screens/HabitsDashboard/HabitsDashboardScreen'
import { RemindersScreen } from '../screens/Reminders/RemindersScreen'
import { ScheduleScreen } from '../screens/Schedule/ScheduleScreen'
import type { AppTabParamList } from './types'

const Tab = createBottomTabNavigator<AppTabParamList>()

export const AppNavigator = () => {
    const [isAddHabitModalVisible, setIsAddHabitModalVisible] = useState(false)
    const [isAddScheduleItemModalVisible, setIsAddScheduleItemModalVisible] =
        useState(false)
    const [isAddReminderEventModalVisible, setIsAddReminderEventModalVisible] =
        useState(false)
    // TODO: Persist this dismissal in onboarding/preferences instead of resetting on app launch.
    const [isDoubleTapHintVisible, setIsDoubleTapHintVisible] = useState(true)
    const openAddHabitModal = () => setIsAddHabitModalVisible(true)
    const closeAddHabitModal = () => setIsAddHabitModalVisible(false)
    const openAddItem = (routeName: string) => {
        if (routeName === 'Schedule') {
            setIsAddScheduleItemModalVisible(true)
            return
        }

        if (routeName === 'Reminders') {
            setIsAddReminderEventModalVisible(true)
            return
        }

        setIsAddHabitModalVisible(true)
    }

    return (
        <Tab.Navigator
            tabBar={props => <BottomBar {...props} onAddItem={openAddItem} />}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen name="Habits">
                {() => (
                    <HabitsDashboardScreen
                        currentUserId="local-user"
                        isAddHabitModalVisible={isAddHabitModalVisible}
                        onOpenAddHabitModal={openAddHabitModal}
                        onCloseAddHabitModal={closeAddHabitModal}
                        isDoubleTapHintVisible={isDoubleTapHintVisible}
                        onCloseDoubleTapHint={() =>
                            setIsDoubleTapHintVisible(false)
                        }
                    />
                )}
            </Tab.Screen>
            <Tab.Screen name="Schedule">
                {() => (
                    <ScheduleScreen
                        isAddItemModalVisible={isAddScheduleItemModalVisible}
                        onCloseAddItemModal={() =>
                            setIsAddScheduleItemModalVisible(false)
                        }
                    />
                )}
            </Tab.Screen>
            <Tab.Screen name="Reminders">
                {() => (
                    <RemindersScreen
                        isAddEventModalVisible={isAddReminderEventModalVisible}
                        onCloseAddEventModal={() =>
                            setIsAddReminderEventModalVisible(false)
                        }
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
                        isDoubleTapHintVisible={isDoubleTapHintVisible}
                        onCloseDoubleTapHint={() =>
                            setIsDoubleTapHintVisible(false)
                        }
                    />
                )}
            </Tab.Screen>
        </Tab.Navigator>
    )
}
