jest.mock('../../../src/services/api', () => ({
    createApi: jest.fn(() => ({ post: jest.fn() })),
}))
jest.mock('../../../src/services/authSession', () => ({
    getValidAccessToken: jest.fn(),
}))
jest.mock('../../../src/constants/api', () => ({
    API_BASE_URL: 'https://api.example.test/api/v1',
}))
jest.mock('../../../src/database', () => ({ database: { get: jest.fn() } }))

import { aiChatResponseSchema } from '../../../src/services/endpoints/ai'

describe('AI chat endpoint', () => {
    it.each([undefined, 'Saúde', 'a'.repeat(100)])(
        'accepts an optional create category of up to 100 characters: %s',
        categoryName => {
            const response = aiChatResponseSchema.parse({
                reply: 'Posso criar Caminhada.',
                proposal: {
                    type: 'habit.create',
                    habit: {
                        name: 'Caminhada',
                        frequencyType: 'daily',
                        ...(categoryName === undefined ? {} : { categoryName }),
                    },
                },
            })

            expect(response.proposal?.type).toBe('habit.create')
            if (response.proposal?.type !== 'habit.create')
                throw new Error('Expected a create proposal')
            expect(response.proposal.habit.categoryName).toBe(categoryName)
        },
    )

    it.each(['a'.repeat(101), null, 123])(
        'rejects an invalid create category: %s',
        categoryName => {
            const result = aiChatResponseSchema.safeParse({
                reply: 'Posso criar Caminhada.',
                proposal: {
                    type: 'habit.create',
                    habit: {
                        name: 'Caminhada',
                        frequencyType: 'daily',
                        categoryName,
                    },
                },
            })

            expect(result.success).toBe(false)
            if (result.success) throw new Error('Expected a validation error')
            expect(result.error.issues[0].path).toEqual([
                'proposal',
                'habit',
                'categoryName',
            ])
        },
    )

    it.each([
        { type: 'habit.completion.create', habitId: 'h1', date: '2026-11-09' },
        { type: 'todo.create', task: { title: 'Buy food' } },
        { type: 'todo.update', entityId: 't1', changes: { isComplete: true } },
        {
            type: 'event.create',
            event: { title: 'Visit', dateTime: '2026-11-10T10:00:00-03:00' },
        },
        {
            type: 'event.update',
            entityId: 'e1',
            changes: { endTime: null, location: null },
        },
        {
            type: 'goal.create',
            goal: {
                habitId: 'h1',
                description: 'Walk 20 times',
                targetValue: 20,
                deadlineType: 'short_term',
            },
        },
        { type: 'goal.update', entityId: 'g1', changes: { targetValue: 24 } },
    ])('accepts the proposal schema for $type', proposal => {
        expect(
            aiChatResponseSchema.safeParse({ reply: 'Review this.', proposal })
                .success,
        ).toBe(true)
    })

    it('rejects invalid action types, reminder types, and empty changes', () => {
        for (const proposal of [
            { type: 'todo.update', entityId: 't1', changes: {} },
            {
                type: 'event.create',
                event: {
                    title: 'Visit',
                    dateTime: '2026-11-10T10:00:00-03:00',
                    reminderType: 'urgent',
                },
            },
            {
                type: 'goal.create',
                goal: {
                    habitId: 'h1',
                    description: 'Walk',
                    targetValue: 2,
                    deadlineType: 'yearly',
                },
            },
        ])
            expect(
                aiChatResponseSchema.safeParse({ reply: 'Review.', proposal })
                    .success,
            ).toBe(false)
    })

    it('validates proposal field formats with Zod', () => {
        expect(() =>
            aiChatResponseSchema.parse({
                reply: 'Try this.',
                proposal: {
                    type: 'habit.update',
                    entityId: 'habit-1',
                    changes: { preferredTime: '7pm' },
                },
            }),
        ).toThrow()
    })
})
