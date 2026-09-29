export const getResponsiveScale = (width: number): number => {
    return Math.min(1, Math.max(0.6, width / 600))
}
