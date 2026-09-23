import type { NavigatorScreenParams } from '@react-navigation/native'

export type AppTabParamList = {
    Habits: undefined
    Schedule: undefined
    Reminders: undefined
    Todo: undefined
}

export type RootParamList = {
    Main: NavigatorScreenParams<AppTabParamList>
}
