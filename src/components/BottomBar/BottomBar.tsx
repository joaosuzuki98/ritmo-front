import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { Fragment } from 'react'
import { Pressable, Text, View, useWindowDimensions } from 'react-native'
import {
    Bell,
    CalendarBlank,
    CheckSquare,
    FirstAid,
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
    const visibleRoutes = state.routes.filter(
        route => route.name !== 'Settings',
    )
    const activeRouteName = state.routes[state.index]?.name
    const isSettingsActive = activeRouteName === 'Settings'
    const addButton = (
        <Pressable
            accessibilityLabel="Add item"
            accessibilityRole="button"
            accessibilityState={{ disabled: isSettingsActive }}
            disabled={isSettingsActive}
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
            <FirstAid
                color={
                    isSettingsActive
                        ? bottomBarStyles.addIconDisabled.color
                        : bottomBarStyles.addIcon.color
                }
                size={50 * scale}
                weight="regular"
            />
            <Text
                style={[
                    bottomBarStyles.addLabel,
                    { fontSize: 20 * scale, marginTop: 2 * scale },
                    isSettingsActive && bottomBarStyles.addLabelDisabled,
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
            {visibleRoutes.map((route, index) => {
                const isFocused = activeRouteName === route.name
                const label = descriptors[route.key].options.title ?? route.name
                const onPress = () => navigation.navigate(route.name)

                const iconColor = isFocused
                    ? bottomBarStyles.routeIconActive.color
                    : bottomBarStyles.routeIcon.color
                const icon =
                    route.name === 'Habits' ? (
                        <Stack
                            color={iconColor}
                            size={36 * scale}
                            weight={isFocused ? 'bold' : 'regular'}
                        />
                    ) : route.name === 'Schedule' ? (
                        <CalendarBlank
                            color={iconColor}
                            size={35 * scale}
                            weight={isFocused ? 'bold' : 'regular'}
                        />
                    ) : route.name === 'Reminders' ? (
                        <Bell
                            color={iconColor}
                            size={35 * scale}
                            weight={isFocused ? 'bold' : 'regular'}
                        />
                    ) : (
                        <CheckSquare
                            color={iconColor}
                            size={35 * scale}
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
