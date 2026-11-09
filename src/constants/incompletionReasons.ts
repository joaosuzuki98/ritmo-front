export const incompletionReasonCodes = [
    'not_enough_time',
    'low_energy',
    'forgot',
    'low_motivation',
    'unexpected_event',
    'other',
] as const

const reasonLabels: Record<IncompletionReasonCode, string> = {
    not_enough_time: 'Not enough time',
    low_energy: 'Low energy',
    forgot: 'I forgot',
    low_motivation: 'Lack of motivation',
    unexpected_event: 'Unexpected event',
    other: 'Other',
}

export type IncompletionReasonCode = (typeof incompletionReasonCodes)[number]

export const incompletionReasonOptions = incompletionReasonCodes.map(value => ({
    value,
    label: reasonLabels[value],
}))

export const getIncompletionReasonLabel = (
    value?: IncompletionReasonCode,
): string | undefined => (value ? reasonLabels[value] : undefined)

export const findIncompletionReasonId = (
    reasons: readonly { id: string; description: string }[],
    value?: IncompletionReasonCode,
): string | undefined => {
    const label = getIncompletionReasonLabel(value)
    if (!label) return undefined

    const normalizedLabel = label.trim().toLocaleLowerCase()
    return reasons.find(
        reason =>
            reason.description.trim().toLocaleLowerCase() === normalizedLabel,
    )?.id
}
