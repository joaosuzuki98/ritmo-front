import { useCallback, useState } from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useNavigation } from '@react-navigation/native'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import type { DrawerNavigationProp } from '@react-navigation/drawer'

import type { User } from '../database'
import { BottomBar } from '../components/BottomBar'
import { HabitsDashboardScreen } from '../screens/HabitsDashboard/HabitsDashboardScreen'
import { RemindersScreen } from '../screens/Reminders/RemindersScreen'
import { ScheduleScreen } from '../screens/Schedule/ScheduleScreen'
import { SettingsScreen } from '../screens/Settings/SettingsScreen'
import { TodoScreen } from '../screens/Todo/TodoScreen'
import type { AppTabParamList, RootParamList } from './types'

type AppNavigatorProps = {
    currentUser: User
    totalAccessDays: number
}

const Tab = createBottomTabNavigator<AppTabParamList>()

export const AppNavigator = ({
    currentUser,
    totalAccessDays,
}: AppNavigatorProps) => {
    const navigation = useNavigation<DrawerNavigationProp<RootParamList>>()
    const [isAddHabitModalVisible, setIsAddHabitModalVisible] = useState(false)
    const [isAddScheduleItemModalVisible, setIsAddScheduleItemModalVisible] =
        useState(false)
    const [isAddReminderEventModalVisible, setIsAddReminderEventModalVisible] =
        useState(false)
    const [isAddTodoTaskModalVisible, setIsAddTodoTaskModalVisible] =
        useState(false)
    const openAddHabitModal = () => setIsAddHabitModalVisible(true)
    const closeAddHabitModal = () => setIsAddHabitModalVisible(false)
    const openAddItem = useCallback(
        (routeName: string) => {
            if (routeName === 'Settings') {
                setIsAddHabitModalVisible(true)
                navigation.navigate('Main', { screen: 'Habits' })
                return
            }

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
        },
        [navigation],
    )
    const renderBottomBar = useCallback(
        (props: BottomTabBarProps) => (
            <BottomBar {...props} onAddItem={openAddItem} />
        ),
        [openAddItem],
    )

    return (
        <Tab.Navigator
            tabBar={renderBottomBar}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen name="Habits">
                {({ route }) => (
                    <HabitsDashboardScreen
                        currentUser={currentUser}
                        totalAccessDays={totalAccessDays}
                        initialWeekDay={route.params?.weekDay}
                        isAddHabitModalVisible={isAddHabitModalVisible}
                        onMenuPress={() => navigation.openDrawer()}
                        onOpenAddHabitModal={openAddHabitModal}
                        onCloseAddHabitModal={closeAddHabitModal}
                        onAnalyzeSchedule={habitId =>
                            navigation.navigate('AskTheStars', {
                                habitId,
                                mode: undefined,
                            })
                        }
                        onWeeklyLoadAnalysis={() =>
                            navigation.navigate('AskTheStars', {
                                habitId: undefined,
                                mode: 'weeklyLoad',
                            })
                        }
                    />
                )}
            </Tab.Screen>
            <Tab.Screen name="Schedule">
                {() => (
                    <ScheduleScreen
                        currentUser={currentUser}
                        totalAccessDays={totalAccessDays}
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
                        totalAccessDays={totalAccessDays}
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
                        totalAccessDays={totalAccessDays}
                        isAddTaskModalVisible={isAddTodoTaskModalVisible}
                        onMenuPress={() => navigation.openDrawer()}
                        onCloseAddTaskModal={() =>
                            setIsAddTodoTaskModalVisible(false)
                        }
                    />
                )}
            </Tab.Screen>
            <Tab.Screen name="Settings">
                {() => (
                    <SettingsScreen
                        currentUser={currentUser}
                        onMenuPress={() => navigation.openDrawer()}
                        totalAccessDays={totalAccessDays}
                    />
                )}
            </Tab.Screen>
        </Tab.Navigator>
    )
}
