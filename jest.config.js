module.exports = {
    preset: '@react-native/jest-preset',
    moduleNameMapper: {
        '\\.(css)$': '<rootDir>/__mocks__/styleMock.js',
        '^@react-native/new-app-screen$':
            '<rootDir>/__mocks__/newAppScreenMock.js',
        '^react-native-safe-area-context$':
            '<rootDir>/__mocks__/safeAreaContextMock.js',
        '^react-native-sound$': '<rootDir>/__mocks__/react-native-sound.js',
        '^react-native-bootsplash$':
            '<rootDir>/__mocks__/react-native-bootsplash.js',
        '^react-native-reanimated$':
            '<rootDir>/__mocks__/react-native-reanimated.js',
        '^react-native-gesture-handler$':
            '<rootDir>/__mocks__/react-native-gesture-handler.js',
    },
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?|react-native-css-interop|@noble/hashes)/)',
    ],
}
