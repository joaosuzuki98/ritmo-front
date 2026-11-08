import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'

import { isAppLanguage } from './languages'
import type { AppLanguage } from './languages'

const LANGUAGE_STORAGE_KEY = 'ritmo.language'

type LanguageState = {
    language: AppLanguage
    hydrateLanguage: () => Promise<void>
    setLanguage: (language: AppLanguage) => Promise<void>
}

export const useLanguageStore = create<LanguageState>(set => ({
    language: 'en',
    hydrateLanguage: async () => {
        try {
            const storedLanguage = await AsyncStorage.getItem(
                LANGUAGE_STORAGE_KEY,
            )
            if (storedLanguage && isAppLanguage(storedLanguage))
                set({ language: storedLanguage })
        } catch {
            set({ language: 'en' })
        }
    },
    setLanguage: async language => {
        set({ language })
        try {
            await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language)
        } catch {
            // Keep the selected language active for this session if storage fails.
        }
    },
}))
