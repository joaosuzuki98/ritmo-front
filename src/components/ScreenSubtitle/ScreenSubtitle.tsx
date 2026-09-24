import type { ReactNode } from 'react'
import { Text, useWindowDimensions } from 'react-native'

import { colors } from '../../styles/colors'
import { getResponsiveScale } from '../../styles/responsive'
import { typography } from '../../styles/typography'

type ScreenSubtitleProps = {
    children: ReactNode
}

export const ScreenSubtitle = ({ children }: ScreenSubtitleProps) => {
    const { width } = useWindowDimensions()
    const scale = getResponsiveScale(width)

    return (
        <Text
            style={{
                color: colors.textMuted,
                fontFamily: typography.fontFamily,
                fontSize: typography.screenSubtitle.fontSize * scale,
            }}
        >
            {children}
        </Text>
    )
}
