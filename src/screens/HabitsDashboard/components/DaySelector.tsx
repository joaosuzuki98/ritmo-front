import { Pressable, View, useWindowDimensions } from 'react-native'
import { CaretLeft, CaretRight } from 'phosphor-react-native'

import {
    cycleWeekDay,
    weekDayLabels,
    type WeekDay,
} from '../../../constants/weekDays'
import { ScreenSubtitle } from '../../../components/ScreenSubtitle'
import { colors } from '../../../styles/colors'
import { getResponsiveScale } from '../../../styles/responsive'

type DaySelectorProps = {
    weekDay: WeekDay
    onChange: (weekDay: WeekDay) => void
}

export const DaySelector = ({ weekDay, onChange }: DaySelectorProps) => {
    const { width } = useWindowDimensions()
    const scale = getResponsiveScale(width)
    return (
        <View
            accessibilityRole="adjustable"
            style={{
                alignItems: 'flex-start',
                flexDirection: 'row',
                justifyContent: 'space-between',
                minHeight: 44 * scale,
                width: 296 * scale,
            }}
        >
            <Pressable
                accessibilityLabel="Previous day"
                onPress={() => onChange(cycleWeekDay(weekDay - 1))}
                style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 12 * scale,
                    transform: [{ translateY: -12 * scale }],
                    width: 48 * scale,
                }}
            >
                <CaretLeft
                    color={colors.textMuted}
                    size={24 * scale}
                    weight="regular"
                />
            </Pressable>
            <View style={{ alignItems: 'center', flex: 1 }}>
                <ScreenSubtitle>{weekDayLabels[weekDay]}</ScreenSubtitle>
            </View>
            <Pressable
                accessibilityLabel="Next day"
                onPress={() => onChange(cycleWeekDay(weekDay + 1))}
                style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 12 * scale,
                    transform: [{ translateY: -12 * scale }],
                    width: 48 * scale,
                }}
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
