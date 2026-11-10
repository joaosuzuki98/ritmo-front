import { useEffect, useState } from 'react'
import { useIsFocused } from '@react-navigation/native'

type AnalysisLoadingOptions = {
    habitId?: string
    isLoading: boolean
    hasLoadError: boolean
}

const minimumLoadingDuration = 700

export const useAnalysisLoading = ({
    habitId,
    isLoading,
    hasLoadError,
}: AnalysisLoadingOptions) => {
    const isFocused = useIsFocused()
    const [readyHabitId, setReadyHabitId] = useState<string | null>(null)

    // Drawer screens stay mounted, so the visible loading phase belongs to each visit.
    useEffect(() => {
        setReadyHabitId(null)
        if (!isFocused || !habitId) return

        const timer = setTimeout(
            () => setReadyHabitId(habitId),
            minimumLoadingDuration,
        )
        return () => clearTimeout(timer)
    }, [habitId, isFocused])

    return (
        Boolean(habitId) &&
        !hasLoadError &&
        (isLoading || !isFocused || readyHabitId !== habitId)
    )
}
