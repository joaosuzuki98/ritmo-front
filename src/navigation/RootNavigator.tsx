import {
    NavigationContainer,
    createNavigationContainerRef,
} from '@react-navigation/native'
import type { RootParamList } from './types'

import { AppNavigator } from './AppNavigator'

export const navigationRef = createNavigationContainerRef<RootParamList>()

export const RootNavigator = () => {
    return (
        <NavigationContainer ref={navigationRef}>
            <AppNavigator />
        </NavigationContainer>
    )
}
