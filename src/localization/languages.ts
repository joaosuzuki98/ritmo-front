export type AppLanguage = 'en' | 'pt'

export const isAppLanguage = (value: string): value is AppLanguage =>
    value === 'en' || value === 'pt'

export const languageLabels: Record<AppLanguage, string> = {
    en: 'English',
    pt: 'Português',
}
