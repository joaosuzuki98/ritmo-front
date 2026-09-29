const React = require('react')

const Animated = {
    View: React.forwardRef((props, ref) =>
        React.createElement('View', { ...props, ref }),
    ),
}

module.exports = {
    __esModule: true,
    default: Animated,
    FadeInDown: { delay: () => undefined },
    ZoomIn: { delay: () => undefined },
    useSharedValue: value => ({ value }),
    useAnimatedStyle: callback => callback(),
    withTiming: value => value,
    withSpring: value => value,
    runOnJS: callback => callback,
}
