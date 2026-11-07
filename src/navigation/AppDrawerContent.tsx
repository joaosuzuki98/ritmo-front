import { DrawerContentScrollView } from '@react-navigation/drawer'
import type { DrawerContentComponentProps } from '@react-navigation/drawer'
import {
    Bell,
    CalendarBlank,
    ChartBar,
    CheckSquare,
    GearSix,
    SignOut,
    Stack,
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

type AppDrawerContentProps = DrawerContentComponentProps & {
    currentUser: User
}

type MenuRoute = keyof AppTabParamList
type MenuItem = {
    label: string
    route: MenuRoute | null
    icon:
        | 'habits'
        | 'schedule'
        | 'reminders'
        | 'todo'
        | 'statistics'
        | 'settings'
    isAvailable: boolean
}

const menuItems: MenuItem[] = [
    { label: 'Habits', route: 'Habits', icon: 'habits', isAvailable: true },
    {
        label: 'Schedule',
        route: 'Schedule',
        icon: 'schedule',
        isAvailable: true,
    },
    {
        label: 'Reminders',
        route: 'Reminders',
        icon: 'reminders',
        isAvailable: true,
    },
    {
        label: 'Todo',
        route: 'Todo',
        icon: 'todo',
        isAvailable: true,
    },
    {
        label: 'Statistics',
        route: null,
        icon: 'statistics',
        isAvailable: false,
    },
    {
        label: 'Settings',
        route: null,
        icon: 'settings',
        isAvailable: false,
    },
]

type MenuIconName = MenuItem['icon']

const getMenuIcon = (name: MenuIconName, color: string) => {
    const iconProps = { color, size: 22, weight: 'regular' as const }

    if (name === 'habits') return <Stack {...iconProps} />
    if (name === 'schedule') return <CalendarBlank {...iconProps} />
    if (name === 'reminders') return <Bell {...iconProps} />
    if (name === 'todo') return <CheckSquare {...iconProps} />
    if (name === 'statistics') return <ChartBar {...iconProps} />
    return <GearSix {...iconProps} />
}

export const AppDrawerContent = ({
    state,
    navigation,
    currentUser,
}: AppDrawerContentProps) => {
    const onLogout = useContext(AppDrawerLogoutContext)
    const { bottom } = useSafeAreaInsets()
    const mainRoute = state.routes.find(route => route.name === 'Main')
    const mainState = mainRoute?.state
    const drawerRouteName = state.routes[state.index]?.name
    const activeRouteName =
        drawerRouteName === 'StartYourDay'
            ? drawerRouteName
            : mainState?.routes?.[mainState.index ?? 0]?.name ?? 'Habits'

    const onSelectRoute = (route: MenuRoute) => {
        navigation.navigate('Main', { screen: route })
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

                <Text style={styles.sectionLabel}>MENU PRINCIPAL</Text>
                <View style={styles.items}>
                    {menuItems.map(item => {
                        const isActive = item.route === activeRouteName
                        const itemColor = item.isAvailable
                            ? isActive
                                ? colors.text
                                : colors.textMuted
                            : colors.priorityFallback

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
                                    !item.isAvailable
                                        ? styles.disabledItem
                                        : null,
                                ]}
                            >
                                {getMenuIcon(item.icon, itemColor)}
                                <Text
                                    style={[
                                        styles.itemLabel,
                                        { color: itemColor },
                                    ]}
                                >
                                    {item.label}
                                </Text>
                                {!item.isAvailable ? (
                                    <Text style={styles.comingSoon}>
                                        EM BREVE
                                    </Text>
                                ) : null}
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
                    accessibilityLabel="Logout"
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
                            color={colors.danger}
                            size={22}
                            weight="regular"
                        />
                        <Text numberOfLines={1} style={styles.logoutLabel}>
                            Logout
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
    sectionLabel: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: spacing.sm,
        marginLeft: spacing.xs,
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
    disabledItem: { opacity: 0.7 },
    itemLabel: {
        flex: 1,
        fontFamily: typography.fontFamily,
        fontSize: 15,
        fontWeight: '600',
        marginLeft: spacing.md,
    },
    comingSoon: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 8,
        fontWeight: '700',
        letterSpacing: 0.5,
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
        color: colors.danger,
        fontFamily: typography.fontFamily,
        fontSize: 15,
        fontWeight: '700',
        marginLeft: spacing.md,
        flexShrink: 0,
    },
})
