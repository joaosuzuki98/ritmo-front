const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')
const { withNativeWind } = require('nativewind/metro')

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const { assetExts, sourceExts } = getDefaultConfig(__dirname).resolver

const config = {
    transformer: {
        babelTransformerPath: require.resolve(
            'react-native-svg-transformer/react-native',
        ),
    },
    resolver: {
        assetExts: assetExts.filter(extension => extension !== 'svg'),
        sourceExts: [...sourceExts, 'svg'],
    },
}

const mergedConfig = mergeConfig(getDefaultConfig(__dirname), config)

module.exports = withNativeWind(mergedConfig, { input: './global.css' })
