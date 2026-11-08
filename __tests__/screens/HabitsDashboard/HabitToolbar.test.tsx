import * as ReactNative from 'react-native'
import { act, create } from 'react-test-renderer'
import type { ReactTestRenderer } from 'react-test-renderer'

import { HabitToolbar } from '../../../src/screens/HabitsDashboard/components/HabitToolbar'

describe('HabitToolbar', () => {
    it('opens weekly load recommendations on the left and keeps search and sort on the right', () => {
        jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({
            width: 390,
            height: 844,
            scale: 1,
            fontScale: 1,
        })
        const onWeeklyLoadPress = jest.fn()
        const onSearch = jest.fn()
        const onSort = jest.fn()
        const rendererRef: { current: ReactTestRenderer | null } = {
            current: null,
        }
        act(() => {
            rendererRef.current = create(
                <HabitToolbar
                    isSearchOpen={false}
                    sort={null}
                    onWeeklyLoadPress={onWeeklyLoadPress}
                    onSearch={onSearch}
                    onSort={onSort}
                />,
            )
        })
        const renderer = rendererRef.current as ReactTestRenderer
        const buttons = renderer.root.findAll(
            node =>
                typeof node.props.accessibilityLabel === 'string' &&
                typeof node.props.onPress === 'function',
        )

        expect(buttons.map(button => button.props.accessibilityLabel)).toEqual([
            'Open weekly habit load recommendations',
            'Open search',
            'Sort by priority',
        ])

        act(() => buttons[0].props.onPress())
        expect(onWeeklyLoadPress).toHaveBeenCalledTimes(1)
        expect(onSearch).not.toHaveBeenCalled()
        expect(onSort).not.toHaveBeenCalled()
        act(() => renderer.unmount())
        jest.restoreAllMocks()
    })
})
