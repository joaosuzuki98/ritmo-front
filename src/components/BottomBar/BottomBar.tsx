import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { Fragment } from 'react'
import { Pressable, Text, View, useWindowDimensions } from 'react-native'
import {
    Bell,
    CalendarBlank,
    CheckSquare,
    Plus,
    Stack,
} from 'phosphor-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { bottomBarStyles } from './BottomBar.styles'
import { getResponsiveScale } from '../../styles/responsive'

type BottomBarProps = BottomTabBarProps & {
    onAddItem: (routeName: string) => void
}

export const BottomBar = ({
    state,
    descriptors,
    navigation,
    onAddItem,
}: BottomBarProps) => {
    const { bottom } = useSafeAreaInsets()
    const { width } = useWindowDimensions()
    const scale = getResponsiveScale(width)
    const addButton = (
        <Pressable
            accessibilityLabel="Add item"
            accessibilityRole="button"
            onPress={() => onAddItem(state.routes[state.index].name)}
            style={[
                bottomBarStyles.add,
                {
                    borderTopLeftRadius: 72 * scale,
                    borderTopRightRadius: 72 * scale,
                    height: 166 * scale,
                    marginTop: -54 * scale,
                    width: 108 * scale,
                },
            ]}
        >
            <Plus
                color={bottomBarStyles.addIcon.color}
                size={55 * scale}
                weight="regular"
            />
            <Text
                style={[
                    bottomBarStyles.addLabel,
                    { fontSize: 20 * scale, marginTop: 2 * scale },
                ]}
            >
                Add
            </Text>
        </Pressable>
    )

    return (
        <View
            style={[
                bottomBarStyles.container,
                { height: 112 * scale + bottom, paddingBottom: bottom },
            ]}
            accessibilityRole="tablist"
        >
            {state.routes.map((route, index) => {
                const isFocused = state.index === index
                const label = descriptors[route.key].options.title ?? route.name
                const onPress = () => navigation.navigate(route.name)

                const iconColor = isFocused
                    ? bottomBarStyles.routeIconActive.color
                    : bottomBarStyles.routeIcon.color
                const icon =
                    route.name === 'Habits' ? (
                        <Stack
                            color={iconColor}
                            size={39 * scale}
                            weight={isFocused ? 'bold' : 'regular'}
                        />
                    ) : route.name === 'Schedule' ? (
                        <CalendarBlank
                            color={iconColor}
                            size={38 * scale}
                            weight={isFocused ? 'bold' : 'regular'}
                        />
                    ) : route.name === 'Reminders' ? (
                        <Bell
                            color={iconColor}
                            size={38 * scale}
                            weight={isFocused ? 'bold' : 'regular'}
                        />
                    ) : (
                        <CheckSquare
                            color={iconColor}
                            size={38 * scale}
                            weight={isFocused ? 'bold' : 'regular'}
                        />
                    )

                const routeButton = (
                    <Pressable
                        key={route.key}
                        accessibilityLabel={`${label} tab`}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: isFocused }}
                        onPress={onPress}
                        style={bottomBarStyles.route}
                    >
                        {icon}
                        <Text
                            style={[
                                bottomBarStyles.routeLabel,
                                { fontSize: 19 * scale, marginTop: 5 * scale },
                                isFocused && bottomBarStyles.routeLabelActive,
                            ]}
                        >
                            {label}
                        </Text>
                    </Pressable>
                )

                return index === 2 ? (
                    <Fragment key={route.key}>
                        {addButton}
                        {routeButton}
                    </Fragment>
                ) : (
                    routeButton
                )
            })}
        </View>
    )
}
