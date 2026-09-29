import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native'

import { colors } from '../../../styles/colors'
import { getResponsiveScale } from '../../../styles/responsive'
import { spacing } from '../../../styles/spacing'
import { typography } from '../../../styles/typography'

type DoubleTapHintModalProps = {
    isVisible: boolean
    onClose: () => void
}

export const DoubleTapHintModal = ({
    isVisible,
    onClose,
}: DoubleTapHintModalProps) => {
    const { width } = useWindowDimensions()
    const scale = getResponsiveScale(width)

    return (
        <Modal
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
            transparent
            visible={isVisible}
        >
            <View style={styles.overlay}>
                <Pressable
                    accessibilityLabel="Close double-tap tip"
                    onPress={onClose}
                    style={styles.backdrop}
                />
                <View
                    accessibilityViewIsModal
                    style={[
                        styles.dialog,
                        {
                            borderRadius: 20 * scale,
                            marginHorizontal: spacing.lg * scale,
                        },
                    ]}
                >
                    <Text style={[styles.eyebrow, { fontSize: 13 * scale }]}>
                        QUICK TIP
                    </Text>
                    <Text style={[styles.title, { fontSize: 28 * scale }]}>
                        Complete a habit faster
                    </Text>
                    <Text style={styles.message}>
                        Double-tap any habit card to mark it as completed for
                        today. A green check and a small celebration will
                        confirm the action.
                    </Text>
                    <Pressable
                        accessibilityLabel="Close double-tap tip"
                        accessibilityRole="button"
                        onPress={onClose}
                        style={styles.button}
                    >
                        <Text style={styles.buttonText}>GOT IT</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    backdrop: {
        backgroundColor: 'rgba(0, 0, 0, 0.62)',
        bottom: 0,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,
    },
    dialog: {
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.border,
        borderWidth: 1,
        maxWidth: 460,
        padding: spacing.lg,
        width: '100%',
    },
    eyebrow: {
        color: colors.success,
        fontFamily: typography.fontFamily,
        fontWeight: '700',
        letterSpacing: 1.2,
    },
    title: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontWeight: '500',
        marginTop: 8,
    },
    message: {
        color: colors.textMuted,
        fontFamily: typography.fontFamily,
        fontSize: 16,
        lineHeight: 23,
        marginTop: 12,
    },
    button: {
        alignItems: 'center',
        backgroundColor: colors.accent,
        borderRadius: 10,
        justifyContent: 'center',
        marginTop: 22,
        minHeight: spacing.touchTarget,
    },
    buttonText: {
        color: colors.text,
        fontFamily: typography.fontFamily,
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.8,
    },
})
