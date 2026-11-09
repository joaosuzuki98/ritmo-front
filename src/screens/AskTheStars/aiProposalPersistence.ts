import { database, type Habit } from '../../database'
import { localDateKey } from '../../utils/normalizeLocalDate'
import type { AiHabitProposal } from '../../services/endpoints/ai'
import {
    completeAfterHabitChain,
    updateHabitStreak,
} from '../HabitsDashboard/useHabitsDashboardViewModel'
import { recordHabitCompletionLocally } from '../HabitsDashboard/completionPersistence'
import {
    createHabitLocally,
    updateHabitLocally,
} from '../HabitsDashboard/habitPersistence'
import { getAiHabitUpdateFormData, toCreateHabitFormData } from './aiChatUtils'
import {
    createHabitGoalLocally,
    updateHabitGoalLocally,
} from '../Todo/habitGoalPersistence'
import {
    createTodoTaskLocally,
    updateTodoTaskLocally,
} from '../Todo/todoTaskPersistence'
import {
    createEventLocally,
    updateEventLocally,
} from '../Reminders/eventPersistence'

const requireOwned = <T extends { userId: string }>(
    record: T | null,
    userId: string,
    label: string,
): T => {
    if (!record || record.userId !== userId)
        throw new Error(`${label} is no longer available.`)
    return record
}

export const applyAiProposalLocally = async (
    userId: string,
    proposal: AiHabitProposal,
) => {
    switch (proposal.type) {
        case 'habit.create': {
            return createHabitLocally(
                userId,
                toCreateHabitFormData(proposal, new Date().getDay() || 7),
                proposal.habit.status,
            )
        }
        case 'habit.update': {
            const habit = await database
                .get<Habit>('habits')
                .find(proposal.entityId)
                .catch(() => null)
            const ownedHabit = requireOwned(habit, userId, 'Habit')
            const data = await getAiHabitUpdateFormData(
                userId,
                ownedHabit,
                proposal.changes,
            )
            return updateHabitLocally(
                userId,
                ownedHabit.id,
                data,
                proposal.changes.status,
            )
        }
        case 'habit.completion.create': {
            const habit = await database
                .get<Habit>('habits')
                .find(proposal.habitId)
                .catch(() => null)
            const ownedHabit = requireOwned(habit, userId, 'Habit')
            const date = new Date(`${proposal.date}T00:00:00`)
            if (
                Number.isNaN(date.getTime()) ||
                localDateKey(date) !== proposal.date
            )
                throw new Error('The proposed completion date is invalid.')
            const completionTime = new Date(date)
            const [hour, minute] = (
                proposal.completionTime ??
                `${String(new Date().getHours()).padStart(2, '0')}:${String(
                    new Date().getMinutes(),
                ).padStart(2, '0')}`
            )
                .split(':')
                .map(Number)
            completionTime.setHours(hour, minute, 0, 0)
            await recordHabitCompletionLocally(
                userId,
                ownedHabit.id,
                date,
                completionTime,
                proposal.note,
            )
            await updateHabitStreak(ownedHabit.id, date)
            await completeAfterHabitChain(
                ownedHabit.id,
                userId,
                date,
                completionTime,
            )
            return
        }
        case 'todo.create': {
            await createTodoTaskLocally(
                userId,
                proposal.task.title,
                proposal.task.category,
                true,
            )
            return
        }
        case 'todo.update': {
            await updateTodoTaskLocally(
                userId,
                proposal.entityId,
                proposal.changes,
            )
            return
        }
        case 'event.create': {
            const data = proposal.event
            await createEventLocally(userId, {
                ...data,
                dateTime: new Date(data.dateTime),
                endTime: data.endTime ? new Date(data.endTime) : undefined,
            })
            return
        }
        case 'event.update': {
            const changes = proposal.changes
            await updateEventLocally(userId, proposal.entityId, {
                ...changes,
                dateTime: changes.dateTime
                    ? new Date(changes.dateTime)
                    : undefined,
                endTime:
                    changes.endTime === null
                        ? null
                        : changes.endTime
                        ? new Date(changes.endTime)
                        : undefined,
            })
            return
        }
        case 'goal.create': {
            await createHabitGoalLocally(userId, proposal.goal)
            return
        }
        case 'goal.update': {
            await updateHabitGoalLocally(
                userId,
                proposal.entityId,
                proposal.changes,
            )
        }
    }
}
