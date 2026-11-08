import { Pressable, View, useWindowDimensions } from 'react-native'
import {
    MagnifyingGlass,
    SquaresFour,
    SlidersHorizontal,
    Sparkle,
} from 'phosphor-react-native'

import type { SortCriterion } from '../habitDashboard.types'
import { colors } from '../../../styles/colors'
import { getResponsiveScale } from '../../../styles/responsive'
import { spacing } from '../../../styles/spacing'

type HabitToolbarProps = {
    isSearchOpen: boolean
    sort: SortCriterion | null
    onWeeklyLoadPress: () => void
    onCategoriesPress: () => void
    onSearch: () => void
    onSort: (sort: SortCriterion | null) => void
}

export const HabitToolbar = ({
    isSearchOpen,
    sort,
    onWeeklyLoadPress,
    onCategoriesPress,
    onSearch,
    onSort,
}: HabitToolbarProps) => {
    const { width } = useWindowDimensions()
    const scale = getResponsiveScale(width)

    return (
        <View
            className="flex-row items-center justify-between"
            style={{
                paddingBottom: 28 * scale,
                paddingHorizontal: spacing.lg * scale,
                paddingTop: 8 * scale,
            }}
        >
            <Pressable
                accessibilityLabel="Open weekly habit load recommendations"
                accessibilityRole="button"
                onPress={onWeeklyLoadPress}
                style={{ padding: 10 * scale }}
            >
                <Sparkle
                    color={colors.text}
                    size={36 * scale}
                    weight="regular"
                />
            </Pressable>
            <View className="flex-row items-center">
                <Pressable
                    accessibilityLabel="Open category distribution"
                    accessibilityRole="button"
                    onPress={onCategoriesPress}
                    style={{ padding: 10 * scale }}
                >
                    <SquaresFour
                        color={colors.text}
                        size={36 * scale}
                        weight="regular"
                    />
                </Pressable>
                <Pressable
                    accessibilityLabel={
                        isSearchOpen ? 'Search open' : 'Open search'
                    }
                    accessibilityState={{ selected: isSearchOpen }}
                    onPress={onSearch}
                    style={{ padding: 10 * scale }}
                >
                    <MagnifyingGlass
                        color={colors.text}
                        size={36 * scale}
                        weight="regular"
                    />
                </Pressable>
                <Pressable
                    accessibilityLabel="Sort by priority"
                    accessibilityState={{ selected: sort === 'priority' }}
                    onPress={() =>
                        onSort(
                            sort === 'priority'
                                ? null
                                : ('priority' as SortCriterion),
                        )
                    }
                    style={{ padding: 10 * scale }}
                >
                    <SlidersHorizontal
                        color={colors.text}
                        size={36 * scale}
                        weight="regular"
                    />
                </Pressable>
            </View>
        </View>
    )
}
