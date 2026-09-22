module.exports = {
  presets: ['module:@react-native/babel-preset', 'nativewind/babel'],
  plugins: [
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    'react-native-worklets/plugin',
  ],
};
