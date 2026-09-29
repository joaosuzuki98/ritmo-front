module.exports = {
    presets: ['module:@react-native/babel-preset', 'nativewind/babel'],
    plugins: [
        ['@babel/plugin-proposal-decorators', { legacy: true }],
        '@babel/plugin-transform-export-namespace-from',
        'react-native-worklets/plugin',
    ],
}
