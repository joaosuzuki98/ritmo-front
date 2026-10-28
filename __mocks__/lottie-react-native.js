const React = require('react')
const { View } = require('react-native')

const playMock = jest.fn()
const LottieView = React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({ play: playMock }))
    return React.createElement(View, props)
})

module.exports = LottieView
module.exports.playMock = playMock
