import { buildLocalReminderPlan } from '../../src/notifications/localReminderPlan'
import type {
    ReminderCompletion,
    ReminderHabit,
} from '../../src/notifications/localReminderPlan'
import type { NotificationPreferences } from '../../src/notifications/notificationPreferences'

const defaultPreferences: NotificationPreferences = {
    notifyHabitStart: false,
    notifyDailyFocus: false,
    notifyPriorityHabits: false,
    notifyLowSuccessHabits: false,
    notifyWeeklyHabitLoad: false,
    minimumPriority: null,
}

const mondayMorning = new Date(2026, 10, 9, 8, 0)

const makeHabit = (overrides: Partial<ReminderHabit>): ReminderHabit => ({
    id: 'habit-1',
    name: 'Read',
    priority: 'low',
    isFocusOfDay: false,
    status: 'pending',
    preferredTime: undefined,
    weekDays: [1],
    ...overrides,
})

describe('buildLocalReminderPlan', () => {
    it('schedules a habit-start reminder 15 minutes before its preferred time', () => {
        const habit = makeHabit({
            preferredTime: new Date(2026, 10, 9, 9, 0),
        })

        const reminders = buildLocalReminderPlan(
            [habit],
            [],
            { ...defaultPreferences, notifyHabitStart: true },
            mondayMorning,
        )

        expect(reminders).toHaveLength(1)
        expect(reminders[0].scheduledAt).toEqual(new Date(2026, 10, 9, 8, 45))
    })

    it('sends one focus digest two hours after the latest focus time', () => {
        const habits = [
            makeHabit({
                id: 'focus-1',
                name: 'Read',
                isFocusOfDay: true,
                preferredTime: new Date(2026, 10, 9, 9, 0),
            }),
            makeHabit({
                id: 'focus-2',
                name: 'Exercise',
                isFocusOfDay: true,
                preferredTime: new Date(2026, 10, 9, 15, 0),
            }),
        ]

        const reminders = buildLocalReminderPlan(
            habits,
            [],
            { ...defaultPreferences, notifyDailyFocus: true },
            mondayMorning,
        )

        expect(reminders).toHaveLength(1)
        expect(reminders[0].scheduledAt).toEqual(new Date(2026, 10, 9, 17, 0))
        expect(reminders[0].body).toContain('Read, Exercise')
    })

    it('uses 18:00 for focus reminders when no focus habit has a preferred time', () => {
        const reminders = buildLocalReminderPlan(
            [makeHabit({ isFocusOfDay: true })],
            [],
            { ...defaultPreferences, notifyDailyFocus: true },
            mondayMorning,
        )

        expect(reminders[0].scheduledAt).toEqual(new Date(2026, 10, 9, 18, 0))
    })

    it('uses the selected priority as a minimum and falls back to 15:00', () => {
        const habits = [
            makeHabit({ id: 'low', name: 'Low habit', priority: 'low' }),
            makeHabit({
                id: 'medium',
                name: 'Medium habit',
                priority: 'medium',
            }),
            makeHabit({ id: 'high', name: 'High habit', priority: 'high' }),
        ]
        const reminders = buildLocalReminderPlan(
            habits,
            [],
            {
                ...defaultPreferences,
                notifyPriorityHabits: true,
                notifyLowSuccessHabits: false,
                minimumPriority: 'medium',
            },
            mondayMorning,
        )

        expect(reminders).toHaveLength(1)
        expect(reminders[0].scheduledAt).toEqual(new Date(2026, 10, 9, 15, 0))
        expect(reminders[0].body).toContain('Medium habit, High habit')
        expect(reminders[0].body).not.toContain('Low habit')
    })

    it('does not schedule a daily reminder when every eligible habit is completed', () => {
        const habit = makeHabit({ isFocusOfDay: true })
        const completion: ReminderCompletion = {
            habitId: habit.id,
            date: new Date(2026, 10, 9),
            status: 'completed',
        }

        expect(
            buildLocalReminderPlan(
                [habit],
                [completion],
                { ...defaultPreferences, notifyDailyFocus: true },
                mondayMorning,
            ),
        ).toEqual([])
    })
})
