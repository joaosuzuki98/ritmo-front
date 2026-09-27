import { FormActionButton } from '../FormActionButton'

type AuthButtonProps = {
    disabled?: boolean
    onPress: () => void
    title: string
}

export const AuthButton = ({
    disabled = false,
    onPress,
    title,
}: AuthButtonProps) => {
    return (
        <FormActionButton disabled={disabled} onPress={onPress} title={title} />
    )
}
