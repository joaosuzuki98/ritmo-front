import { useCallback } from 'react'

import { useLanguageStore } from './useLanguageStore'
import type { AppLanguage } from './languages'
import { translate } from './translations'

export const useTranslation = () => {
    const language = useLanguageStore(state => state.language)
    const setLanguage = useLanguageStore(state => state.setLanguage)
    const t = useCallback(
        (text: string, values?: Record<string, string | number>) =>
            translate(text, language, values),
        [language],
    )

    return { language, setLanguage, t }
}

export type { AppLanguage }
