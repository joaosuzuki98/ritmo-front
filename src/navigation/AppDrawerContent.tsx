import { DrawerContentScrollView } from '@react-navigation/drawer'
import type { DrawerContentComponentProps } from '@react-navigation/drawer'
import {
    ChartBar,
    GearSix,
    SignOut,
    Sparkle,
    Storefront,
    Trophy,
    UserCircle,
    UsersThree,
} from 'phosphor-react-native'
import { useContext } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import UserMascot from '../assets/images/mascot/default-mascot.svg'
import type { User } from '../database'
import { colors } from '../styles/colors'
import { spacing } from '../styles/spacing'
import { typography } from '../styles/typography'
import { AppDrawerLogoutContext } from './AppDrawerLogoutContext'
import type { AppTabParamList } from './types'
import { useTranslation } from '../localization/useTranslation'

type AppDrawerContentProps = DrawerContentComponentProps & {
    currentUser: User
}

type MenuRoute = keyof AppTabParamList | 'AskTheStars'
type MenuItem = {
    label: string
    route: MenuRoute | null
    icon:
        | 'profile'
        | 'ranking'
        | 'friends'
        | 'astrology'
        | 'statistics'
        | 'shop'
        | 'settings'
    isAvailable: boolean
}

const menuItems: MenuItem[] = [
    {
        label: 'Profile',
        route: null,
        icon: 'profile',
        isAvailable: false,
    },
    {
        label: 'Leaderboard',
        route: null,
        icon: 'ranking',
        isAvailable: false,
    },
    {
        label: 'Friends',
        route: null,
        icon: 'friends',
        isAvailable: false,
    },
    {
        label: 'Ask the Stars',
        route: 'AskTheStars',
        icon: 'astrology',
        isAvailable: true,
    },
    {
        label: 'Statistics',
        route: null,
        icon: 'statistics',
        isAvailable: false,
    },
    {
        label: 'Shop',
        route: null,
        icon: 'shop',
        isAvailable: false,
    },
    {
        label: 'Settings',
        route: 'Settings',
        icon: 'settings',
        isAvailable: true,
    },
]

type MenuIconName = MenuItem['icon']

const getMenuIcon = (name: MenuIconName, color: string) => {
    const iconProps = { color, size: 22, weight: 'regular' as const }

    if (name === 'profile') return <UserCircle {...iconProps} />
    if (name === 'ranking') return <Trophy {...iconProps} />
    if (name === 'friends') return <UsersThree {...iconProps} />
    if (name === 'astrology') return <Sparkle {...iconProps} />
    if (name === 'statistics') return <ChartBar {...iconProps} />
    if (name === 'shop') return <Storefront {...iconProps} />
    return <GearSix {...iconProps} />
}

export const AppDrawerContent = ({
    state,
    navigation,
    currentUser,
}: AppDrawerContentProps) => {
    const onLogout = useContext(AppDrawerLogoutContext)
    const { t } = useTranslation()
    const { bottom } = useSafeAreaInsets()
    const mainRoute = state.routes.find(route => route.name === 'Main')
    const mainState = mainRoute?.state
    const drawerRouteName = state.routes[state.index]?.name
    const activeRouteName =
        drawerRouteName === 'StartYourDay' || drawerRouteName === 'AskTheStars'
            ? drawerRouteName
            : mainState?.routes?.[mainState.index ?? 0]?.name ?? 'Habits'

    const onSelectRoute = (route: MenuRoute) => {
        navigation.closeDrawer()
        if (route === 'AskTheStars')
            navigation.navigate('AskTheStars', {
                habitId: undefined,
                mode: undefined,
            })
        else navigation.navigate('Main', { screen: route })
    }

    return (
        <View style={styles.container}>
            <DrawerContentScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.profile}>
                    <View style={styles.profileIcon}>
                        <UserMascot height={42} width={42} />
                    </View>
                    <View style={styles.profileIdentity}>
                        <Text numberOfLines={1} style={styles.profileName}>
                            {currentUser.name}
                        </Text>
                        <Text numberOfLines={1} style={styles.profileEmail}>
                            {currentUser.email}
                        </Text>
                    </View>
                </View>

                <View style={styles.items}>
                    {menuItems.map(item => {
                        const isActive = item.route === activeRouteName
                        const itemColor = isActive
                            ? colors.text
                            : colors.textMuted

                        return (
                            <Pressable
                                key={item.label}
                                accessibilityRole="button"
                                accessibilityState={{
                                    disabled: !item.isAvailable,
                                    selected: isActive,
                                }}
                                disabled={!item.isAvailable}
                                onPress={() => {
                                    if (item.route) onSelectRoute(item.route)
                                }}
                                style={[
                                    styles.item,
                                    isActive ? styles.activeItem : null,
                                ]}
                            >
                                {getMenuIcon(item.icon, itemColor)}
                                <Text
                                    style={[
                                        styles.itemLabel,
                                        { color: itemColor },
                                    ]}
                                >
                                    {t(item.label)}
                                </Text>
                            </Pressable>
                        )
                    })}
                </View>
            </DrawerContentScrollView>

            <View
                style={[styles.bottom, { paddingBottom: bottom + spacing.md }]}
            >
                <View style={styles.separator} />
                <Pressable
                    accessibilityLabel={t('Logout')}
                    accessibilityRole="button"
                    onPress={onLogout}
                    style={({ pressed }) => [
                        styles.logout,
                        styles.logoutRow,
                        pressed ? styles.logoutPressed : null,
                    ]}
                >
                    <View style={styles.logoutContent}>
                        <SignOut
                            color={colors.dayCount}
                            size={22}
                            weight="regular"
                        />
                        <Text numberOfLines={1} style={styles.logoutLabel}>
                            {t('Logout')}
                        </Text>
                    </View>
                </Pressable>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.surface,
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.xl,
    },
    profile: {
        alignItems: 'center',
        flexDirection: 'row',
        marginBottom: spacing.xl,
        paddingHorizontal: spacing.xs,
    },
    profileIcon: {
        alignItems: 'center',
        borderRadius: 24,
        height: 48,
        justifyContent: 'center',
        marginRight: spacing.md,
        width: 48,
    },
    profileIdentity: {
        alignItems: 'flex-start',
        flex: 1,
        flexDirection: 'column',
        flexShrink: 1,
    },
    profileName: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 16,
        fontWeight: '700',
    },
    profileEmail: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 12,
        marginTop: spacing.xxs,
    },
    items: { gap: spacing.xxs },
    item: {
        alignItems: 'center',
        borderRadius: 13,
        flexDirection: 'row',
        minHeight: 52,
        paddingHorizontal: spacing.md,
    },
    activeItem: { backgroundColor: colors.surfaceMuted },
    itemLabel: {
        flex: 1,
        fontFamily: typography.fontFamily,
        fontSize: 15,
        fontWeight: '600',
        marginLeft: spacing.md,
    },
    bottom: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
    separator: {
        backgroundColor: colors.border,
        height: StyleSheet.hairlineWidth,
        marginBottom: spacing.sm,
    },
    logout: {
        alignItems: 'center',
        alignSelf: 'stretch',
        borderRadius: 13,
        minHeight: 52,
        paddingHorizontal: spacing.md,
    },
    logoutRow: { flexDirection: 'row' },
    logoutContent: {
        alignItems: 'center',
        flexDirection: 'row',
    },
    logoutPressed: { backgroundColor: colors.surfaceMuted },
    logoutLabel: {
        color: colors.dayCount,
        fontFamily: typography.fontFamily,
        fontSize: 15,
        fontWeight: '700',
        marginLeft: spacing.md,
        flexShrink: 0,
    },
})
