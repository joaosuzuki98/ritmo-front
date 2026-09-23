import { Pressable, View, useWindowDimensions } from 'react-native'
import { MagnifyingGlass, SlidersHorizontal } from 'phosphor-react-native'

import type { SortCriterion } from '../habitDashboard.types'
import { colors } from '../../../styles/colors'
import { getResponsiveScale } from '../../../styles/responsive'

type HabitToolbarProps = {
    isSearchOpen: boolean
    sort: SortCriterion | null
    onSearch: () => void
    onSort: (sort: SortCriterion | null) => void
}

export const HabitToolbar = ({
    isSearchOpen,
    sort,
    onSearch,
    onSort,
}: HabitToolbarProps) => {
    const { width } = useWindowDimensions()
    const scale = getResponsiveScale(width)

    return (
        <View
            style={{
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'flex-end',
                paddingBottom: 28 * scale,
                paddingTop: 8 * scale,
            }}
        >
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
                    size={42 * scale}
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
                    size={39 * scale}
                    weight="regular"
                />
            </Pressable>
        </View>
    )
}
