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
                    minHeight: 104 * scale + top,
                    paddingHorizontal: 24 * scale,
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
                        borderRadius: 38 * scale,
                        height: 76 * scale,
                        width: 76 * scale,
                    },
                ]}
            />
            <View style={[topBarStyles.identity, { marginLeft: 16 * scale }]}>
                <Text
                    numberOfLines={1}
                    style={[topBarStyles.name, { fontSize: 29 * scale }]}
                >
                    {userName}
                </Text>
            </View>
            <View style={[topBarStyles.stats, { gap: 16 * scale }]}>
                <View style={[topBarStyles.stat, { gap: 6 * scale }]}>
                    <Lightning
                        color={topBarStyles.lightning.color}
                        size={38 * scale}
                        weight="fill"
                    />
                    <Text
                        style={[
                            topBarStyles.statValue,
                            { fontSize: 30 * scale },
                        ]}
                    >
                        {totalPoints}
                    </Text>
                </View>
                <View style={[topBarStyles.stat, { gap: 6 * scale }]}>
                    <Fire
                        color={topBarStyles.fire.color}
                        size={35 * scale}
                        weight="fill"
                    />
                    <Text
                        style={[
                            topBarStyles.statValue,
                            { fontSize: 30 * scale },
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
                    { marginLeft: 24 * scale, padding: 6 * scale },
                ]}
            >
                <List
                    color={topBarStyles.menuText.color}
                    size={42 * scale}
                    weight="regular"
                />
            </Pressable>
        </View>
    )
}
