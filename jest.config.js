module.exports = {
    preset: '@react-native/jest-preset',
    moduleNameMapper: {
        '\\.(css)$': '<rootDir>/__mocks__/styleMock.js',
        '^@react-native/new-app-screen$':
            '<rootDir>/__mocks__/newAppScreenMock.js',
        '^react-native-safe-area-context$':
            '<rootDir>/__mocks__/safeAreaContextMock.js',
    },
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?|react-native-css-interop)/)',
    ],
}
