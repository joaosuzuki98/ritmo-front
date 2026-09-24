import type { ReactNode } from 'react'
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native'

import { TopBar } from '../TopBar'
import { colors } from '../../styles/colors'
import { globalStyles } from '../../styles/globalStyles'
import { getResponsiveScale } from '../../styles/responsive'
import { spacing } from '../../styles/spacing'
import { typography } from '../../styles/typography'

export type ScreenLayoutProps = {
    children: ReactNode
    title: string
    subtitle?: ReactNode
    titleAccessory?: ReactNode
    userName: string
    level: number
    totalPoints: number
    onProfilePress: () => void
    onMenuPress: () => void
}

export const ScreenLayout = ({
    children,
    title,
    subtitle,
    titleAccessory,
    userName,
    level,
    totalPoints,
    onProfilePress,
    onMenuPress,
}: ScreenLayoutProps) => {
    const { width } = useWindowDimensions()
    const scale = getResponsiveScale(width)

    return (
        <View style={globalStyles.screen}>
            <TopBar
                level={level}
                onMenuPress={onMenuPress}
                onProfilePress={onProfilePress}
                totalPoints={totalPoints}
                userName={userName}
            />
            <View style={[styles.header, { paddingTop: spacing.lg * scale }]}>
                <View style={styles.titleRow}>
                    <Text
                        style={[
                            styles.title,
                            {
                                fontSize:
                                    typography.screenTitle.fontSize * scale,
                            },
                        ]}
                    >
                        {title}
                    </Text>
                    {titleAccessory}
                </View>
                {subtitle ? (
                    <View style={styles.subtitle}>{subtitle}</View>
                ) : null}
            </View>
            {children}
        </View>
    )
}

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        backgroundColor: colors.surface,
        paddingBottom: spacing.lg,
    },
    titleRow: { alignItems: 'center', flexDirection: 'row' },
    title: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontWeight: '500',
    },
    subtitle: { marginTop: 0 },
})
