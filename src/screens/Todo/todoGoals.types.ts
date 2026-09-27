import type { Goal, GroupConsistencyGoal } from '../../database'

export type TodoGoalHabitOption = {
    id: string
    title: string
    weekDays: number[]
    frequencyType: string
}

export type HabitGoalCardData = {
    type: 'habit'
    id: string
    model: Goal
    title: string
    description: string
    termLabel: string
    dueDate: Date
    currentValue: number
    targetValue: number
    progress: number
    status: string
}

export type GroupGoalCardData = {
    type: 'group'
    id: string
    model: GroupConsistencyGoal
    title: string
    description: string
    termLabel: string
    dueDate: Date
    includedHabitTitles: string[]
    targetPercentage: number
    actualPercentage: number
    progress: number
    status: string
}

export type TodoGoalCardData = HabitGoalCardData | GroupGoalCardData
