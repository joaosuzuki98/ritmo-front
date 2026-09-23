import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useState } from 'react'

import { BottomBar } from '../components/BottomBar'
import { HabitsDashboardScreen } from '../screens/HabitsDashboard/HabitsDashboardScreen'
import type { AppTabParamList } from './types'

const Tab = createBottomTabNavigator<AppTabParamList>()

export const AppNavigator = () => {
    const [isAddHabitModalVisible, setIsAddHabitModalVisible] = useState(false)
    // TODO: Persist this dismissal in onboarding/preferences instead of resetting on app launch.
    const [isDoubleTapHintVisible, setIsDoubleTapHintVisible] = useState(true)
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
                        isDoubleTapHintVisible={isDoubleTapHintVisible}
                        onCloseDoubleTapHint={() =>
                            setIsDoubleTapHintVisible(false)
                        }
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
                        isDoubleTapHintVisible={isDoubleTapHintVisible}
                        onCloseDoubleTapHint={() =>
                            setIsDoubleTapHintVisible(false)
                        }
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
                        isDoubleTapHintVisible={isDoubleTapHintVisible}
                        onCloseDoubleTapHint={() =>
                            setIsDoubleTapHintVisible(false)
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
