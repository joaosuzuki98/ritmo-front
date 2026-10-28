const React = require('react')
const { View } = require('react-native')

const SafeAreaProvider = ({ children }) =>
    React.createElement(React.Fragment, null, children)

const SafeAreaView = ({ children, ...props }) =>
    React.createElement(View, props, children)

const useSafeAreaInsets = () => ({ top: 0, right: 0, bottom: 0, left: 0 })

module.exports = { SafeAreaProvider, SafeAreaView, useSafeAreaInsets }
