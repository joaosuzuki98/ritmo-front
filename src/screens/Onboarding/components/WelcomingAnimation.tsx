import { useEffect, useRef, useState } from 'react'
import LottieView from 'lottie-react-native'

import {
    welcomingAnimation,
    welcomingEndFrame,
    welcomingIdleStartFrame,
} from '../welcomingAnimation'

type WelcomingAnimationProps = {
    height: number
    width: number
}

export const WelcomingAnimation = ({
    height,
    width,
}: WelcomingAnimationProps) => {
    const animationRef = useRef<LottieView>(null)
    const [isIdleLooping, setIsIdleLooping] = useState(false)

    useEffect(() => {
        if (isIdleLooping) {
            animationRef.current?.play(
                welcomingIdleStartFrame,
                welcomingEndFrame - 1,
            )
        }
    }, [isIdleLooping])

    const handleAnimationFinish = (isCancelled: boolean) => {
        if (!isCancelled) setIsIdleLooping(true)
    }

    return (
        <LottieView
            ref={animationRef}
            autoPlay
            loop={isIdleLooping}
            onAnimationFinish={handleAnimationFinish}
            resizeMode="contain"
            source={welcomingAnimation}
            style={{ height, width }}
            testID="onboarding-lottie-animation"
        />
    )
}
