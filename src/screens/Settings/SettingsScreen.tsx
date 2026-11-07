import { useState } from 'react'
import {
    Pressable,
    Platform,
    ScrollView,
    Text,
    View,
    useWindowDimensions,
} from 'react-native'

import type { User } from '../../database'
import { ScreenLayout } from '../../components/ScreenLayout/ScreenLayout'
import { ScreenSubtitle } from '../../components/ScreenSubtitle/ScreenSubtitle'
import { getResponsiveScale } from '../../styles/responsive'
import { priorityCodes } from '../../constants/priorities'
import { SettingsCheckbox } from './components/SettingsCheckbox'
import { SettingsSelect } from './components/SettingsSelect'
import { settingsScreenStyles as styles } from './SettingsScreen.styles'
import { useSettingsViewModel } from './useSettingsViewModel'

type SettingsScreenProps = {
    currentUser: User
    totalAccessDays: number
    onMenuPress: () => void
}

export const SettingsScreen = ({
    currentUser,
    totalAccessDays,
    onMenuPress,
}: SettingsScreenProps) => {
    const { width } = useWindowDimensions()
    const scale = getResponsiveScale(width)
    const {
        errorMessage,
        openSystemNotificationSettings,
        preferences,
        togglePreference,
        updatePreference,
    } = useSettingsViewModel(currentUser.id)
    const isPriorityPickerEnabled = preferences.notifyPriorityHabits
    const [language, setLanguage] = useState('English')
    const [theme, setTheme] = useState('System')

    const onSelectMinimumPriority = async (value: string) => {
        const priority = priorityCodes.find(code => code === value)
        if (priority) await updatePreference({ minimumPriority: priority })
    }

    return (
        <ScreenLayout
            onMenuPress={onMenuPress}
            onProfilePress={() => undefined}
            title="Settings"
            subtitle={
                <ScreenSubtitle>Customize your experience</ScreenSubtitle>
            }
            totalAccessDays={totalAccessDays}
            totalPoints={currentUser.totalPoints}
            userName={currentUser.name}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View>
                    <Text
                        style={[styles.sectionTitle, { fontSize: 30 * scale }]}
                    >
                        General
                    </Text>
                    <SettingsSelect
                        accessibilityLabel="Select language"
                        containerStyle={styles.field}
                        label="Language"
                        onSelect={setLanguage}
                        options={[
                            { value: 'English', label: 'English' },
                            { value: 'Português', label: 'Português' },
                        ]}
                        value={language}
                    />
                    <SettingsSelect
                        accessibilityLabel="Select theme"
                        containerStyle={styles.field}
                        label="Theme"
                        onSelect={setTheme}
                        options={[
                            { value: 'System', label: 'System' },
                            { value: 'Dark', label: 'Dark' },
                            { value: 'Light', label: 'Light' },
                        ]}
                        value={theme}
                    />
                </View>

                <View style={styles.notificationsSection}>
                    <Text
                        style={[styles.sectionTitle, { fontSize: 30 * scale }]}
                    >
                        Notifications
                    </Text>
                    <View style={styles.checkboxList}>
                        <SettingsCheckbox
                            checked={preferences.notifyHabitStart}
                            label="Notify me when a habit is about to start (15 minutes beforehand)"
                            onPress={() => togglePreference('notifyHabitStart')}
                        />
                        <SettingsCheckbox
                            checked={preferences.notifyDailyFocus}
                            label="Remind me about focus habits I haven't completed today"
                            onPress={() => togglePreference('notifyDailyFocus')}
                        />
                        <SettingsCheckbox
                            checked={preferences.notifyPriorityHabits}
                            label="Remind me about priority habits I haven't completed"
                            onPress={() =>
                                togglePreference('notifyPriorityHabits')
                            }
                        />
                    </View>

                    <SettingsSelect
                        accessibilityLabel="Select minimum priority"
                        containerStyle={styles.priorityPicker}
                        disabled={!isPriorityPickerEnabled}
                        label="Minimum priority"
                        onSelect={onSelectMinimumPriority}
                        options={[
                            { value: 'low', label: 'Low' },
                            { value: 'medium', label: 'Medium' },
                            { value: 'high', label: 'High' },
                        ]}
                        placeholder="Select priority level"
                        value={preferences.minimumPriority ?? ''}
                    />

                    {Platform.OS === 'android' ? (
                        <View>
                            <Text style={styles.inlineMessage}>
                                Allow alarms and reminders in Android settings
                                to schedule local notifications.
                            </Text>
                            <Pressable
                                accessibilityRole="button"
                                onPress={openSystemNotificationSettings}
                            >
                                <Text style={styles.inlineAction}>
                                    Open notification settings
                                </Text>
                            </Pressable>
                        </View>
                    ) : null}
                    {errorMessage ? (
                        <Text style={styles.errorMessage}>{errorMessage}</Text>
                    ) : null}
                </View>

                <View style={styles.dangerSection}>
                    <Text
                        style={[styles.dangerTitle, { fontSize: 30 * scale }]}
                    >
                        Danger Zone
                    </Text>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ disabled: true }}
                        disabled
                        style={styles.deleteButton}
                    >
                        <Text style={styles.deleteButtonText}>
                            Delete account
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </ScreenLayout>
    )
}
