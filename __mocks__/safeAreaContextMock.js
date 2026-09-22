const React = require('react')

const SafeAreaProvider = ({ children }) =>
    React.createElement(React.Fragment, null, children)

const useSafeAreaInsets = () => ({ top: 0, right: 0, bottom: 0, left: 0 })

module.exports = { SafeAreaProvider, useSafeAreaInsets }
