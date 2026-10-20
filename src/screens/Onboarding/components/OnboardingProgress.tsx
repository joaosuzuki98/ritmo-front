import { View } from 'react-native'

import { colors } from '../../../styles/colors'
import { spacing } from '../../../styles/spacing'

type OnboardingProgressProps = {
    currentStep: number
    totalSteps?: number
}

export const OnboardingProgress = ({
    currentStep,
    totalSteps = 6,
}: OnboardingProgressProps) => (
    <View
        accessibilityLabel={`Onboarding progress, page ${currentStep} of ${totalSteps}`}
        accessibilityRole="progressbar"
        accessibilityValue={{ max: totalSteps, min: 1, now: currentStep }}
        className="flex-row items-center justify-center"
        style={{ gap: spacing.xs }}
    >
        {Array.from({ length: totalSteps }, (_, index) => (
            <View
                key={index}
                className="rounded-full"
                style={{
                    backgroundColor:
                        index + 1 === currentStep
                            ? colors.onboardingPurple
                            : colors.onboardingMuted,
                    height: spacing.sm,
                    width:
                        index + 1 === currentStep
                            ? spacing.xl + spacing.md
                            : spacing.xl,
                }}
            />
        ))}
    </View>
)
