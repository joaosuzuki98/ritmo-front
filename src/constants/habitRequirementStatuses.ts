export const habitRequirementStatuses = [
    'completed',
    'partial',
    'skipped',
] as const

export type HabitRequirementStatus = (typeof habitRequirementStatuses)[number]

export const habitRequirementStatusLabels: Record<
    HabitRequirementStatus,
    string
> = {
    completed: 'Completed',
    partial: 'Partially completed',
    skipped: 'Not completed',
}
