import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useNavigation } from '@react-navigation/native'
import { useState } from 'react'
import type { DrawerNavigationProp } from '@react-navigation/drawer'

import type { User } from '../database'
import { BottomBar } from '../components/BottomBar'
import { HabitsDashboardScreen } from '../screens/HabitsDashboard/HabitsDashboardScreen'
import { RemindersScreen } from '../screens/Reminders/RemindersScreen'
import { ScheduleScreen } from '../screens/Schedule/ScheduleScreen'
import { TodoScreen } from '../screens/Todo/TodoScreen'
import type { AppTabParamList, RootParamList } from './types'

type AppNavigatorProps = {
    currentUser: User
}

const Tab = createBottomTabNavigator<AppTabParamList>()

export const AppNavigator = ({ currentUser }: AppNavigatorProps) => {
    const navigation = useNavigation<DrawerNavigationProp<RootParamList>>()
    const [isAddHabitModalVisible, setIsAddHabitModalVisible] = useState(false)
    const [isAddScheduleItemModalVisible, setIsAddScheduleItemModalVisible] =
        useState(false)
    const [isAddReminderEventModalVisible, setIsAddReminderEventModalVisible] =
        useState(false)
    const [isAddTodoTaskModalVisible, setIsAddTodoTaskModalVisible] =
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

        if (routeName === 'Todo') {
            setIsAddTodoTaskModalVisible(true)
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
                        currentUser={currentUser}
                        isAddHabitModalVisible={isAddHabitModalVisible}
                        onMenuPress={() => navigation.openDrawer()}
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
                        currentUser={currentUser}
                        isAddItemModalVisible={isAddScheduleItemModalVisible}
                        onMenuPress={() => navigation.openDrawer()}
                        onCloseAddItemModal={() =>
                            setIsAddScheduleItemModalVisible(false)
                        }
                    />
                )}
            </Tab.Screen>
            <Tab.Screen name="Reminders">
                {() => (
                    <RemindersScreen
                        currentUser={currentUser}
                        isAddEventModalVisible={isAddReminderEventModalVisible}
                        onMenuPress={() => navigation.openDrawer()}
                        onCloseAddEventModal={() =>
                            setIsAddReminderEventModalVisible(false)
                        }
                    />
                )}
            </Tab.Screen>
            <Tab.Screen name="Todo">
                {() => (
                    <TodoScreen
                        currentUser={currentUser}
                        isAddTaskModalVisible={isAddTodoTaskModalVisible}
                        onMenuPress={() => navigation.openDrawer()}
                        onCloseAddTaskModal={() =>
                            setIsAddTodoTaskModalVisible(false)
                        }
                    />
                )}
            </Tab.Screen>
        </Tab.Navigator>
    )
}
