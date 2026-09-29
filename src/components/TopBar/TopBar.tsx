import { Pressable, Text, View, useWindowDimensions } from 'react-native'
import { Fire, Lightning, List } from 'phosphor-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { topBarStyles } from './TopBar.styles'
import { getResponsiveScale } from '../../styles/responsive'

export type TopBarProps = {
    userName: string
    level: number
    totalPoints: number
    onProfilePress: () => void
    onMenuPress: () => void
}

export const TopBar = ({
    userName,
    level,
    totalPoints,
    onProfilePress,
    onMenuPress,
}: TopBarProps) => {
    const { width } = useWindowDimensions()
    const { top } = useSafeAreaInsets()
    const scale = getResponsiveScale(width)

    return (
        <View
            style={[
                topBarStyles.container,
                {
                    minHeight: 88 * scale + top,
                    paddingHorizontal: 20 * scale,
                    paddingTop: top,
                },
            ]}
            accessibilityRole="header"
        >
            <Pressable
                accessibilityLabel="Open user profile"
                accessibilityRole="button"
                onPress={onProfilePress}
                style={[
                    topBarStyles.profile,
                    {
                        borderRadius: 32 * scale,
                        height: 64 * scale,
                        width: 64 * scale,
                    },
                ]}
            />
            <View style={[topBarStyles.identity, { marginLeft: 12 * scale }]}>
                <Text
                    numberOfLines={1}
                    style={[topBarStyles.name, { fontSize: 24 * scale }]}
                >
                    {userName}
                </Text>
            </View>
            <View style={[topBarStyles.stats, { gap: 12 * scale }]}>
                <View style={[topBarStyles.stat, { gap: 4 * scale }]}>
                    <Lightning
                        color={topBarStyles.lightning.color}
                        size={29 * scale}
                        weight="fill"
                    />
                    <Text
                        style={[
                            topBarStyles.statValue,
                            { fontSize: 24 * scale },
                        ]}
                    >
                        {totalPoints}
                    </Text>
                </View>
                <View style={[topBarStyles.stat, { gap: 4 * scale }]}>
                    <Fire
                        color={topBarStyles.fire.color}
                        size={27 * scale}
                        weight="fill"
                    />
                    <Text
                        style={[
                            topBarStyles.statValue,
                            { fontSize: 24 * scale },
                        ]}
                    >
                        {level}
                    </Text>
                </View>
            </View>
            <Pressable
                accessibilityLabel="Open menu"
                accessibilityRole="button"
                onPress={onMenuPress}
                style={[
                    topBarStyles.menu,
                    { marginLeft: 16 * scale, padding: 6 * scale },
                ]}
            >
                <List
                    color={topBarStyles.menuText.color}
                    size={34 * scale}
                    weight="regular"
                />
            </Pressable>
        </View>
    )
}
