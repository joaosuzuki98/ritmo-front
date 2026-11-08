/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import './global.css'
import { useEffect, useState } from 'react'
import { StatusBar, useColorScheme } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { RootNavigator } from './src/navigation/RootNavigator'
import { useLanguageStore } from './src/localization/useLanguageStore'

const App = () => {
    const isDarkMode = useColorScheme() === 'dark'
    const [isLanguageLoaded, setIsLanguageLoaded] = useState(false)
    const hydrateLanguage = useLanguageStore(state => state.hydrateLanguage)

    useEffect(() => {
        hydrateLanguage().finally(() => setIsLanguageLoaded(true))
    }, [hydrateLanguage])

    if (!isLanguageLoaded) return null

    return (
        <GestureHandlerRootView>
            <SafeAreaProvider>
                <StatusBar
                    barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                />
                <RootNavigator />
            </SafeAreaProvider>
        </GestureHandlerRootView>
    )
}

export default App
