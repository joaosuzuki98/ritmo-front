jest.mock('@react-native-async-storage/async-storage', () => ({
    __esModule: true,
    default: {
        getItem: jest.fn(),
        setItem: jest.fn(),
    },
}))

import AsyncStorage from '@react-native-async-storage/async-storage'

import { isAppLanguage } from '../../src/localization/languages'
import { useLanguageStore } from '../../src/localization/useLanguageStore'
import { translate } from '../../src/localization/translations'

const getItem = AsyncStorage.getItem as jest.Mock
const setItem = AsyncStorage.setItem as jest.Mock

describe('localization', () => {
    beforeEach(() => {
        getItem.mockReset().mockResolvedValue(null)
        setItem.mockReset().mockResolvedValue(undefined)
        useLanguageStore.setState({ language: 'en' })
    })

    afterEach(() => {
        useLanguageStore.setState({ language: 'en' })
    })

    it('translates Portuguese copy and interpolates values', () => {
        expect(translate('Settings', 'pt')).toBe('Configurações')
        expect(translate('Ask the Stars', 'pt')).toBe('Consulte os astros')
        expect(translate('Day n° {{dayNumber}}', 'pt', { dayNumber: 4 })).toBe(
            'Dia nº 4',
        )
    })

    it('leaves English copy unchanged', () => {
        expect(translate('Settings', 'en')).toBe('Settings')
    })

    it('accepts only supported language codes', () => {
        expect(isAppLanguage('pt')).toBe(true)
        expect(isAppLanguage('en')).toBe(true)
        expect(isAppLanguage('es')).toBe(false)
    })

    it('restores the saved language when the app starts', async () => {
        getItem.mockResolvedValue('pt')

        await useLanguageStore.getState().hydrateLanguage()

        expect(useLanguageStore.getState().language).toBe('pt')
        expect(getItem).toHaveBeenCalledWith('ritmo.language')
    })

    it('persists a language selection', async () => {
        await useLanguageStore.getState().setLanguage('pt')

        expect(useLanguageStore.getState().language).toBe('pt')
        expect(setItem).toHaveBeenCalledWith('ritmo.language', 'pt')
    })
})
