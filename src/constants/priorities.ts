import { colors } from '../styles/colors'

export const priorityCodes = ['low', 'medium', 'high'] as const
export type PriorityCode = (typeof priorityCodes)[number]

export type PriorityPresentation = {
    label: string
    accessibleLabel: string
    color: string
    rank: number
}

export const priorityPresentations: Record<PriorityCode, PriorityPresentation> =
    {
        low: {
            label: 'Low',
            accessibleLabel: 'Low priority',
            color: colors.priorityLow,
            rank: 1,
        },
        medium: {
            label: 'Medium',
            accessibleLabel: 'Medium priority',
            color: colors.priorityMedium,
            rank: 2,
        },
        high: {
            label: 'High',
            accessibleLabel: 'High priority',
            color: colors.priorityHigh,
            rank: 3,
        },
    }

export const getPriorityPresentation = (
    value: string,
): PriorityPresentation => {
    return (
        priorityPresentations[value as PriorityCode] ?? {
            label: 'Unspecified',
            accessibleLabel: 'Unspecified priority',
            color: colors.priorityFallback,
            rank: 0,
        }
    )
}
