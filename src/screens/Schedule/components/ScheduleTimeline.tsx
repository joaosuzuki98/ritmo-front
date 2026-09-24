import { useEffect, useState } from 'react'
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native'

import type { ScheduleEntry } from '../schedule.types'
import { colors } from '../../../styles/colors'
import { getResponsiveScale } from '../../../styles/responsive'
import { typography } from '../../../styles/typography'

type ScheduleTimelineProps = {
    entries: ScheduleEntry[]
    getHourLabel: (hour: number) => string
    selectedDate: Date
}

const firstHour = 0
const lastHour = 23
const baseHourHeight = 102

export const ScheduleTimeline = ({
    entries,
    getHourLabel,
    selectedDate,
}: ScheduleTimelineProps) => {
    const { width } = useWindowDimensions()
    const scale = getResponsiveScale(width)
    const hourHeight = baseHourHeight * scale
    const [currentTime, setCurrentTime] = useState(() => new Date())
    const isSelectedDateToday =
        selectedDate.getFullYear() === currentTime.getFullYear() &&
        selectedDate.getMonth() === currentTime.getMonth() &&
        selectedDate.getDate() === currentTime.getDate()
    const currentHour = isSelectedDateToday ? currentTime.getHours() : -1
    const hours = Array.from(
        { length: lastHour - firstHour + 1 },
        (_, index) => firstHour + index,
    )

    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 60_000)
        return () => clearInterval(interval)
    }, [])

    return (
        <ScrollView
            accessibilityLabel="Schedule timeline"
            contentContainerStyle={{ minHeight: hours.length * hourHeight }}
            showsVerticalScrollIndicator={false}
            style={styles.container}
        >
            <View style={{ height: hours.length * hourHeight }}>
                {hours.map(hour => (
                    <View
                        key={hour}
                        style={[
                            styles.hourRow,
                            {
                                height: hourHeight,
                                backgroundColor:
                                    hour === currentHour
                                        ? colors.scheduleCurrent
                                        : 'transparent',
                            },
                        ]}
                    >
                        <View
                            pointerEvents="none"
                            style={[
                                styles.timeLabel,
                                {
                                    paddingLeft: 34 * scale,
                                    top:
                                        (hour === 12
                                            ? 11
                                            : hour === 0
                                            ? 20
                                            : 36) * scale,
                                    width: 116 * scale,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.timeText,
                                    {
                                        fontSize: 21 * scale,
                                        lineHeight: 25 * scale,
                                    },
                                ]}
                            >
                                {getHourLabel(hour)}
                            </Text>
                        </View>
                    </View>
                ))}
                {entries.map(entry => (
                    <View
                        accessibilityLabel={`${entry.title.replace(
                            '\n',
                            ' ',
                        )} from ${getHourLabel(
                            entry.startHour,
                        )} to ${getHourLabel(entry.endHour)}`}
                        key={entry.id}
                        style={[
                            styles.entry,
                            {
                                backgroundColor: entry.habitId
                                    ? colors.scheduleLinked
                                    : entry.isManual
                                    ? colors.scheduleManual
                                    : colors.scheduleBackground,
                                height: Math.max(
                                    hourHeight,
                                    (entry.endHour - entry.startHour) *
                                        hourHeight,
                                ),
                                top: (entry.startHour - firstHour) * hourHeight,
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.entryTitle,
                                {
                                    fontSize: 31 * scale,
                                    left: 278 * scale,
                                    right: 24 * scale,
                                },
                            ]}
                        >
                            {entry.title}
                        </Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: { backgroundColor: colors.scheduleBackground, flex: 1 },
    hourRow: {
        borderBottomColor: colors.scheduleLine,
        borderBottomWidth: 1,
        position: 'relative',
    },
    timeLabel: { position: 'absolute', zIndex: 2 },
    timeText: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontWeight: '300',
    },
    entry: {
        alignItems: 'center',
        borderBottomColor: colors.scheduleLine,
        borderBottomWidth: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        left: 0,
        position: 'absolute',
        right: 0,
    },
    entryTitle: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontWeight: '500',
        position: 'absolute',
        textAlign: 'center',
    },
})
