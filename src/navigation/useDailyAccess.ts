import { useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'

import { registerDailyAccess } from '../database/registerDailyAccess'

type DailyAccessState = {
    date: string
    shouldShowStart: boolean
    totalAccessDays: number
}

export const useDailyAccess = (userId: string) => {
    const [access, setAccess] = useState<DailyAccessState | null>(null)
    const [hasError, setHasError] = useState(false)
    const [retryToken, setRetryToken] = useState(0)
    const pendingAccess = useRef<ReturnType<typeof registerDailyAccess> | null>(
        null,
    )

    useEffect(() => {
        let active = true
        const checkAccess = async () => {
            try {
                // Effect replay and overlapping foreground events share the same result.
                pendingAccess.current ??= registerDailyAccess(userId).finally(
                    () => {
                        pendingAccess.current = null
                    },
                )
                const result = await pendingAccess.current
                if (!active) return
                setHasError(false)
                setAccess(current => {
                    if (current?.date === result.date) return current
                    return {
                        date: result.date,
                        shouldShowStart:
                            result.isFirstAccess && result.hasHabits,
                        totalAccessDays: result.totalAccessDays,
                    }
                })
            } catch {
                if (active) setHasError(true)
            }
        }

        checkAccess()
        const subscription = AppState.addEventListener('change', state => {
            if (state === 'active') checkAccess()
        })
        return () => {
            active = false
            subscription.remove()
        }
    }, [userId, retryToken])

    const finishStart = () => {
        setAccess(current => current && { ...current, shouldShowStart: false })
    }

    return {
        access,
        hasError,
        finishStart,
        retry: () => setRetryToken(current => current + 1),
    }
}
