import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native'
import { CaretLeft, CaretRight } from 'phosphor-react-native'

import {
    cycleWeekDay,
    weekDayLabels,
    type WeekDay,
} from '../../../constants/weekDays'
import { ScreenSubtitle } from '../../../components/ScreenSubtitle'
import { colors } from '../../../styles/colors'
import { getResponsiveScale } from '../../../styles/responsive'
import { spacing } from '../../../styles/spacing'
import { typography } from '../../../styles/typography'
import { useTranslation } from '../../../localization/useTranslation'

type DaySelectorProps = {
    weekDay: WeekDay
    onChange: (weekDay: WeekDay) => void
}

export const DaySelector = ({ weekDay, onChange }: DaySelectorProps) => {
    const { width } = useWindowDimensions()
    const { t } = useTranslation()
    const scale = getResponsiveScale(width)
    return (
        <View
            accessibilityRole="adjustable"
            style={[
                styles.container,
                { width: spacing.dateNavigationWidth * scale },
            ]}
        >
            <Pressable
                accessibilityLabel={t('Previous day')}
                onPress={() => onChange(cycleWeekDay(weekDay - 1))}
                style={[
                    styles.dayButton,
                    styles.previousDayButton,
                    {
                        height: spacing.touchTarget * scale,
                        top:
                            (-(
                                spacing.touchTarget -
                                typography.screenSubtitle.fontSize
                            ) *
                                scale) /
                            2,
                        width: spacing.dateNavigationButtonWidth * scale,
                    },
                ]}
            >
                <CaretLeft
                    color={colors.textMuted}
                    size={24 * scale}
                    weight="regular"
                />
            </Pressable>
            <View style={styles.subtitle}>
                <ScreenSubtitle>{t(weekDayLabels[weekDay])}</ScreenSubtitle>
            </View>
            <Pressable
                accessibilityLabel={t('Next day')}
                onPress={() => onChange(cycleWeekDay(weekDay + 1))}
                style={[
                    styles.dayButton,
                    styles.nextDayButton,
                    {
                        height: spacing.touchTarget * scale,
                        top:
                            (-(
                                spacing.touchTarget -
                                typography.screenSubtitle.fontSize
                            ) *
                                scale) /
                            2,
                        width: spacing.dateNavigationButtonWidth * scale,
                    },
                ]}
            >
                <CaretRight
                    color={colors.textMuted}
                    size={24 * scale}
                    weight="regular"
                />
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dayButton: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
    },
    previousDayButton: { left: 0 },
    subtitle: { alignItems: 'center', flex: 1 },
    nextDayButton: { right: 0 },
})
