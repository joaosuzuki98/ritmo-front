import type { NavigatorScreenParams } from '@react-navigation/native'
import type { WeekDay } from '../constants/weekDays'

export type AppTabParamList = {
    Habits: { weekDay?: WeekDay } | undefined
    Schedule: undefined
    Reminders: undefined
    Todo: undefined
    Settings: undefined
}

export type RootParamList = {
    Main: NavigatorScreenParams<AppTabParamList>
    StartYourDay: undefined
    AskTheStars: { habitId?: string; mode?: 'weeklyLoad' } | undefined
}
