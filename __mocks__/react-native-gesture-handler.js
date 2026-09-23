const React = require('react')

const PanGestureHandler = ({ children }) =>
    React.createElement(React.Fragment, null, children)
const GestureHandlerRootView = ({ children, ...props }) =>
    React.createElement('View', props, children)

module.exports = { PanGestureHandler, GestureHandlerRootView }
