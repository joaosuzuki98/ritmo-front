import { Pressable, Text, View, useWindowDimensions } from 'react-native'
import { CaretLeft, CaretRight } from 'phosphor-react-native'

import {
    cycleWeekDay,
    weekDayLabels,
    type WeekDay,
} from '../../../constants/weekDays'
import { colors } from '../../../styles/colors'
import { getResponsiveScale } from '../../../styles/responsive'
import { typography } from '../../../styles/typography'

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
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingBottom: 30 * scale,
                paddingTop: 8 * scale,
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
                    width: 48 * scale,
                }}
            >
                <CaretLeft
                    color={colors.text}
                    size={34 * scale}
                    weight="regular"
                />
            </Pressable>
            <Text
                accessibilityRole="header"
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                numberOfLines={1}
                style={{
                    color: colors.text,
                    fontFamily: typography.fontFamily,
                    fontSize: 39 * scale,
                    fontWeight: '300',
                    textAlign: 'center',
                    width: 216 * scale,
                }}
            >
                {weekDayLabels[weekDay]}
            </Text>
            <Pressable
                accessibilityLabel="Next day"
                onPress={() => onChange(cycleWeekDay(weekDay + 1))}
                style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 12 * scale,
                    width: 48 * scale,
                }}
            >
                <CaretRight
                    color={colors.text}
                    size={34 * scale}
                    weight="regular"
                />
            </Pressable>
        </View>
    )
}
