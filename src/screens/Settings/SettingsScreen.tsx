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
import { isAppLanguage } from '../../localization/languages'
import { useTranslation } from '../../localization/useTranslation'
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
    const { language, setLanguage, t } = useTranslation()
    const {
        errorMessage,
        openSystemNotificationSettings,
        preferences,
        togglePreference,
        updatePreference,
    } = useSettingsViewModel(currentUser.id)
    const isPriorityPickerEnabled = preferences.notifyPriorityHabits
    const [theme, setTheme] = useState('System')

    const onSelectMinimumPriority = async (value: string) => {
        const priority = priorityCodes.find(code => code === value)
        if (priority) await updatePreference({ minimumPriority: priority })
    }

    return (
        <ScreenLayout
            onMenuPress={onMenuPress}
            onProfilePress={() => undefined}
            title={t('Settings')}
            subtitle={
                <ScreenSubtitle>
                    {t('Customize your experience')}
                </ScreenSubtitle>
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
                        {t('General')}
                    </Text>
                    <SettingsSelect
                        accessibilityLabel={t('Select language')}
                        containerStyle={styles.field}
                        label={t('Language')}
                        onSelect={value => {
                            if (isAppLanguage(value)) setLanguage(value)
                        }}
                        options={[
                            { value: 'en', label: 'English' },
                            { value: 'pt', label: 'Português' },
                        ]}
                        value={language}
                    />
                    <SettingsSelect
                        accessibilityLabel={t('Select theme')}
                        containerStyle={styles.field}
                        label={t('Theme')}
                        onSelect={setTheme}
                        options={[
                            { value: 'System', label: t('System') },
                            { value: 'Dark', label: t('Dark') },
                            { value: 'Light', label: t('Light') },
                        ]}
                        value={theme}
                    />
                </View>

                <View style={styles.notificationsSection}>
                    <Text
                        style={[styles.sectionTitle, { fontSize: 30 * scale }]}
                    >
                        {t('Notifications')}
                    </Text>
                    <View style={styles.checkboxList}>
                        <SettingsCheckbox
                            checked={preferences.notifyHabitStart}
                            label={t(
                                'Notify me when a habit is about to start (15 minutes beforehand)',
                            )}
                            onPress={() => togglePreference('notifyHabitStart')}
                        />
                        <SettingsCheckbox
                            checked={preferences.notifyDailyFocus}
                            label={t(
                                "Remind me about focus habits I haven't completed today",
                            )}
                            onPress={() => togglePreference('notifyDailyFocus')}
                        />
                        <SettingsCheckbox
                            checked={preferences.notifyLowSuccessHabits}
                            label={t(
                                "Notify me when a habit's success rate is low (less than 15% success rate)",
                            )}
                            onPress={() =>
                                togglePreference('notifyLowSuccessHabits')
                            }
                        />
                        <SettingsCheckbox
                            checked={preferences.notifyWeeklyHabitLoad}
                            label={t(
                                'Send me weekly habit load recommendations',
                            )}
                            onPress={() =>
                                togglePreference('notifyWeeklyHabitLoad')
                            }
                        />
                        <SettingsCheckbox
                            checked={preferences.notifyPriorityHabits}
                            label={t(
                                "Remind me about priority habits I haven't completed",
                            )}
                            onPress={() =>
                                togglePreference('notifyPriorityHabits')
                            }
                        />
                    </View>

                    <SettingsSelect
                        accessibilityLabel={t('Select minimum priority')}
                        containerStyle={styles.priorityPicker}
                        disabled={!isPriorityPickerEnabled}
                        label={t('Minimum priority')}
                        onSelect={onSelectMinimumPriority}
                        options={[
                            { value: 'low', label: t('Low') },
                            { value: 'medium', label: t('Medium') },
                            { value: 'high', label: t('High') },
                        ]}
                        placeholder={t('Select priority level')}
                        value={preferences.minimumPriority ?? ''}
                    />

                    {Platform.OS === 'android' ? (
                        <View>
                            <Text style={styles.inlineMessage}>
                                {t(
                                    'Allow alarms and reminders in Android settings to schedule local notifications.',
                                )}
                            </Text>
                            <Pressable
                                accessibilityRole="button"
                                onPress={openSystemNotificationSettings}
                            >
                                <Text style={styles.inlineAction}>
                                    {t('Open notification settings')}
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
                        {t('Danger Zone')}
                    </Text>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ disabled: true }}
                        disabled
                        style={styles.deleteButton}
                    >
                        <Text style={styles.deleteButtonText}>
                            {t('Delete account')}
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </ScreenLayout>
    )
}
