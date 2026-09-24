import {
    Pressable,
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
    onOpenLink: (hour: number) => void
}

const firstHour = 6
const lastHour = 22
const baseHourHeight = 102

export const ScheduleTimeline = ({
    entries,
    getHourLabel,
    onOpenLink,
}: ScheduleTimelineProps) => {
    const { width } = useWindowDimensions()
    const scale = getResponsiveScale(width)
    const hourHeight = baseHourHeight * scale
    const hours = Array.from(
        { length: lastHour - firstHour + 1 },
        (_, index) => firstHour + index,
    )

    return (
        <ScrollView
            accessibilityLabel="Schedule timeline"
            contentContainerStyle={{ minHeight: hours.length * hourHeight }}
            showsVerticalScrollIndicator={false}
            style={styles.container}
        >
            <View style={{ height: hours.length * hourHeight }}>
                {hours.map(hour => (
                    <Pressable
                        accessibilityLabel={`Link a habit at ${getHourLabel(
                            hour,
                        )}`}
                        key={hour}
                        onPress={() => onOpenLink(hour)}
                        style={[
                            styles.hourRow,
                            {
                                height: hourHeight,
                            },
                        ]}
                    >
                        <View
                            pointerEvents="none"
                            style={[
                                styles.timeLabel,
                                {
                                    paddingLeft: 34 * scale,
                                    top: 36 * scale,
                                    width: 116 * scale,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.timeText,
                                    { fontSize: 25 * scale },
                                ]}
                            >
                                {getHourLabel(hour)}
                            </Text>
                        </View>
                    </Pressable>
                ))}
                {entries.map(entry => (
                    <Pressable
                        accessibilityLabel={`${entry.title.replace(
                            '\n',
                            ' ',
                        )} from ${getHourLabel(
                            entry.startHour,
                        )} to ${getHourLabel(entry.endHour)}`}
                        key={entry.id}
                        onPress={
                            entry.habitId
                                ? () => onOpenLink(entry.startHour)
                                : undefined
                        }
                        style={[
                            styles.entry,
                            {
                                backgroundColor: entry.isCurrent
                                    ? colors.scheduleCurrent
                                    : entry.habitId
                                    ? colors.scheduleLinked
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
                    </Pressable>
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
