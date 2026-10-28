import type { ReactNode } from 'react'
import {
    Animated,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    Text,
    View,
    useWindowDimensions,
} from 'react-native'
import type { StyleProp, TextStyle, ViewStyle } from 'react-native'
import { X } from 'phosphor-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useBottomSheetAnimation } from '../../hooks/useBottomSheetAnimation'
import { getResponsiveScale } from '../../styles/responsive'
import { theme } from '../../styles/theme'

export type BottomSheetLayoutProps = {
    children: ReactNode
    isVisible: boolean
    onClose: () => void
    onDismiss?: () => void
    closeAccessibilityLabel: string
    isCloseDisabled?: boolean
    title?: string
    subtitle?: ReactNode
    titleStyle?: StyleProp<TextStyle>
    headerStyle?: StyleProp<ViewStyle>
    sheetStyle?: StyleProp<ViewStyle>
    closeIconSize?: number
    backdropColor?: string
    animation?: 'custom' | 'slide'
    shouldAvoidKeyboard?: boolean
    heightMode?: 'fixed' | 'max' | 'auto'
    heightRatio?: number
}

export const BottomSheetLayout = ({
    children,
    isVisible,
    onClose,
    onDismiss,
    closeAccessibilityLabel,
    isCloseDisabled = false,
    title,
    subtitle,
    titleStyle,
    headerStyle,
    sheetStyle,
    closeIconSize = theme.bottomSheet.closeIconSize,
    backdropColor = theme.colors.bottomSheetBackdrop,
    animation = 'custom',
    shouldAvoidKeyboard = true,
    heightMode = 'max',
    heightRatio = theme.bottomSheet.heightRatio,
}: BottomSheetLayoutProps) => {
    const { height, width } = useWindowDimensions()
    const { bottom } = useSafeAreaInsets()
    const scale = getResponsiveScale(width)
    const isCustomAnimation = animation === 'custom'
    const { backdropOpacity, isModalMounted, sheetTranslateY } =
        useBottomSheetAnimation(
            isVisible && isCustomAnimation,
            height,
            onDismiss,
        )

    const handleClose = () => {
        if (!isCloseDisabled) onClose()
    }

    const sheet = (
        <Animated.View
            style={[
                {
                    backgroundColor: theme.colors.background,
                    borderTopColor: theme.colors.border,
                    borderTopWidth: theme.bottomSheet.borderWidth,
                    borderTopLeftRadius: theme.bottomSheet.cornerRadius * scale,
                    borderTopRightRadius:
                        theme.bottomSheet.cornerRadius * scale,
                    paddingTop: theme.bottomSheet.paddingTop,
                    paddingHorizontal: theme.spacing.lg * scale,
                    paddingBottom: bottom,
                },
                heightMode === 'fixed' && { height: height * heightRatio },
                heightMode === 'max' && { maxHeight: height * heightRatio },
                sheetStyle,
                isCustomAnimation && {
                    transform: [{ translateY: sheetTranslateY }],
                },
            ]}
        >
            {title ? (
                <View
                    className="flex-row items-center justify-between"
                    style={headerStyle}
                >
                    <View>
                        <Text
                            style={[
                                {
                                    color: theme.colors.text,
                                    fontFamily: theme.typography.fontFamily,
                                    fontWeight:
                                        theme.bottomSheet.title.fontWeight,
                                    fontSize:
                                        theme.bottomSheet.title.fontSize *
                                        scale,
                                },
                                titleStyle,
                            ]}
                        >
                            {title}
                        </Text>
                        {subtitle}
                    </View>
                    <Pressable
                        accessibilityLabel={closeAccessibilityLabel}
                        accessibilityRole="button"
                        className="items-center justify-center"
                        disabled={isCloseDisabled}
                        onPress={handleClose}
                        style={{
                            height: theme.spacing.touchTarget,
                            width: theme.spacing.touchTarget,
                        }}
                    >
                        <X
                            color={theme.colors.text}
                            size={closeIconSize * scale}
                        />
                    </Pressable>
                </View>
            ) : null}
            {children}
        </Animated.View>
    )

    return (
        <Modal
            animationType={isCustomAnimation ? 'none' : 'slide'}
            onRequestClose={handleClose}
            onDismiss={isCustomAnimation ? undefined : onDismiss}
            statusBarTranslucent
            transparent
            visible={isCustomAnimation ? isModalMounted : isVisible}
        >
            <View className="flex-1 justify-end">
                <Animated.View
                    className="absolute inset-0"
                    style={[
                        { backgroundColor: backdropColor },
                        isCustomAnimation && { opacity: backdropOpacity },
                    ]}
                >
                    <Pressable
                        accessibilityLabel={closeAccessibilityLabel}
                        accessibilityRole="button"
                        className="absolute inset-0"
                        disabled={isCloseDisabled}
                        onPress={handleClose}
                    />
                </Animated.View>
                {shouldAvoidKeyboard ? (
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        className="flex-1 justify-end"
                        pointerEvents="box-none"
                    >
                        {sheet}
                    </KeyboardAvoidingView>
                ) : (
                    sheet
                )}
            </View>
        </Modal>
    )
}
