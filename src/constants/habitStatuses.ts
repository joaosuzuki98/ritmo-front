export const habitStatusCodes = ['pending', 'completed', 'skipped'] as const
export type HabitStatusCode = (typeof habitStatusCodes)[number]

export type HabitStatusPresentation = {
    label: string
    rank: number
}

export const habitStatusPresentations: Record<
    HabitStatusCode,
    HabitStatusPresentation
> = {
    pending: { label: 'Pending', rank: 1 },
    completed: { label: 'Completed', rank: 3 },
    skipped: { label: 'Skipped', rank: 2 },
}

export const getHabitStatusPresentation = (
    value: string,
): HabitStatusPresentation => {
    return (
        habitStatusPresentations[value as HabitStatusCode] ?? {
            label: 'Unknown',
            rank: 0,
        }
    )
}
