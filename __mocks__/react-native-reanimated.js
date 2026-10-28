const React = require('react')

const Animated = {
    View: React.forwardRef((props, ref) =>
        React.createElement('View', { ...props, ref }),
    ),
    Text: React.forwardRef((props, ref) =>
        React.createElement('Text', { ...props, ref }),
    ),
}

module.exports = {
    __esModule: true,
    default: Animated,
    ZoomIn: { delay: () => undefined },
    useSharedValue: value => ({ value }),
    useAnimatedStyle: callback => callback(),
    interpolateColor: (value, input, output) =>
        value <= input[0] ? output[0] : output[output.length - 1],
    withTiming: value => value,
    withSequence: (...values) => values[values.length - 1],
    runOnJS: callback => callback,
}
