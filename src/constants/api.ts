import { Platform } from 'react-native'
import Config from 'react-native-config'

const apiBaseUrl =
    Platform.OS === 'android'
        ? Config.API_BASE_URL_ANDROID
        : Config.API_BASE_URL_IOS

if (!apiBaseUrl) {
    throw new Error(
        `Missing API base URL for ${Platform.OS}. Check your .env file.`,
    )
}

export const API_BASE_URL = apiBaseUrl
