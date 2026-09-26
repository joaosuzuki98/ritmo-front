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

import { colors } from '../styles/colors'
import { spacing } from '../styles/spacing'
import { typography } from '../styles/typography'
import { AppDrawerLogoutContext } from './AppDrawerLogoutContext'
import type { AppTabParamList } from './types'

type AppDrawerContentProps = DrawerContentComponentProps

const menuItems = [
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
    { label: 'Todo', route: 'Todo', icon: 'todo', isAvailable: true },
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
] as const

type MenuIconName = (typeof menuItems)[number]['icon']

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
}: AppDrawerContentProps) => {
    const onLogout = useContext(AppDrawerLogoutContext)
    const mainRoute = state.routes.find(route => route.name === 'Main')
    const mainState = mainRoute?.state
    const activeRouteName =
        mainState?.routes?.[mainState.index ?? 0]?.name ?? 'Habits'

    const onSelectRoute = (route: keyof AppTabParamList) => {
        navigation.navigate('Main', { screen: route })
    }

    return (
        <View style={styles.container}>
            <DrawerContentScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.brand}>
                    <View style={styles.brandIcon}>
                        <Stack color={colors.white} size={23} weight="bold" />
                    </View>
                    <View>
                        <Text style={styles.brandName}>Ritmo</Text>
                        <Text style={styles.brandSubtitle}>
                            SEU DIA, NO SEU TEMPO
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

            <View style={styles.bottom}>
                <View style={styles.separator} />
                <Pressable
                    accessibilityLabel="Logout"
                    accessibilityRole="button"
                    onPress={onLogout}
                    style={({ pressed }) => [
                        styles.logout,
                        pressed ? styles.logoutPressed : null,
                    ]}
                >
                    <SignOut color={colors.danger} size={22} weight="regular" />
                    <Text style={styles.logoutLabel}>Logout</Text>
                </Pressable>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.surface,
        flex: 1,
        paddingBottom: spacing.md,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.xl,
    },
    brand: {
        alignItems: 'center',
        flexDirection: 'row',
        marginBottom: spacing.xl,
        paddingHorizontal: spacing.xs,
    },
    brandIcon: {
        alignItems: 'center',
        backgroundColor: colors.accentStrong,
        borderRadius: 14,
        height: 46,
        justifyContent: 'center',
        marginRight: spacing.md,
        width: 46,
    },
    brandName: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 21,
        fontWeight: '700',
    },
    brandSubtitle: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 9,
        fontWeight: '600',
        letterSpacing: 0.8,
        marginTop: 2,
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
        borderRadius: 13,
        flexDirection: 'row',
        minHeight: 52,
        paddingHorizontal: spacing.md,
    },
    logoutPressed: { backgroundColor: colors.surfaceMuted },
    logoutLabel: {
        color: colors.danger,
        fontFamily: typography.fontFamily,
        fontSize: 15,
        fontWeight: '700',
        marginLeft: spacing.md,
    },
})
