const notificationSettings = {
    authorizationStatus: 1,
    android: { alarm: 1 },
}

const notifee = {
    cancelNotification: jest.fn(async () => undefined),
    createChannel: jest.fn(async ({ id }) => id),
    createTriggerNotification: jest.fn(async ({ id }) => id),
    getNotificationSettings: jest.fn(async () => notificationSettings),
    getTriggerNotifications: jest.fn(async () => []),
    openAlarmPermissionSettings: jest.fn(async () => undefined),
    openNotificationSettings: jest.fn(async () => undefined),
    requestPermission: jest.fn(async () => notificationSettings),
}

module.exports = {
    AndroidImportance: { DEFAULT: 3 },
    AndroidNotificationSetting: {
        DISABLED: 0,
        ENABLED: 1,
        NOT_SUPPORTED: -1,
    },
    AuthorizationStatus: {
        AUTHORIZED: 1,
        DENIED: 0,
        NOT_DETERMINED: -1,
        PROVISIONAL: 2,
    },
    TriggerType: { TIMESTAMP: 0 },
    default: notifee,
}
