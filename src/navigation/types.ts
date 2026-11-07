import type { NavigatorScreenParams } from '@react-navigation/native'

export type AppTabParamList = {
    Habits: undefined
    Schedule: undefined
    Reminders: undefined
    Todo: undefined
    Settings: undefined
}

export type RootParamList = {
    Main: NavigatorScreenParams<AppTabParamList>
    StartYourDay: undefined
    AskTheStars: { habitId?: string } | undefined
}
