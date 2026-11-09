import type { Habit } from '../../../src/database'
import {
    buildAiChatContext,
    getRecentAiChatHistory,
    toCreateHabitFormData,
    type AiConversationMessage,
} from '../../../src/screens/AskTheStars/aiChatUtils'

describe('Ask the Stars chat helpers', () => {
    it('maps the proposed category to the existing creation form', () => {
        const values = toCreateHabitFormData(
            {
                type: 'habit.create',
                habit: {
                    name: 'Caminhada',
                    frequencyType: 'daily',
                    categoryName: 'Saúde',
                },
            },
            4,
        )

        expect(values.categoryName).toBe('Saúde')
    })

    it('sends at most 30 unpaused habits with local weekday and time formats only', () => {
        const habits = Array.from(
            { length: 35 },
            (_, index) =>
                ({
                    id: `habit-${index}`,
                    userId: 'user-1',
                    name: `Habit ${index}`,
                    frequencyType: 'daily',
                    weekDays: [1, 2, 3, 4, 5, 6, 7],
                    preferredTime: new Date(2026, 0, 1, 9, 5),
                    status: index === 0 ? 'paused' : 'pending',
                    completionHistory: [{ status: 'completed' }],
                } as unknown as Habit),
        )

        const context = buildAiChatContext(habits)

        expect(context).toHaveLength(30)
        expect(context[0]).toMatchObject({
            id: 'habit-1',
            weekDays: [1, 2, 3, 4, 5, 6, 7],
            preferredTime: '09:05',
        })
        expect(context[0]).not.toHaveProperty('completionHistory')
        expect(context[0]).not.toHaveProperty('userId')
    })

    it('keeps only the ten most recent conversation turns', () => {
        const messages = Array.from({ length: 12 }, (_, index) => ({
            id: `message-${index}`,
            role: index % 2 === 0 ? 'user' : 'assistant',
            content: `Message ${index}`,
        })) as AiConversationMessage[]

        expect(getRecentAiChatHistory(messages)).toEqual(
            messages.slice(-10).map(({ role, content }) => ({ role, content })),
        )
    })

    it('converts create proposals to form defaults without inventing a timestamp', () => {
        const values = toCreateHabitFormData(
            {
                type: 'habit.create',
                habit: {
                    name: 'Walking',
                    frequencyType: 'daily',
                    preferredTime: '07:15',
                },
            },
            4,
        )

        expect(values).toMatchObject({
            name: 'Walking',
            frequencyType: 'daily',
            weekDays: [1, 2, 3, 4, 5, 6, 7],
            preferredTime: '07:15',
            priority: 'medium',
            categoryName: '',
            dependencyHabitId: '',
            conditionHabitId: '',
        })
    })
})
