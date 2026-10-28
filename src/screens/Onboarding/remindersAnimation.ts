import source from '../../assets/animations/moon_reminders_and_todo.json'

// The gaze holds on the bell at frames 102–150 in this 60 fps export.
const blinkFrames = [108, 120, 132]
const blinkDuration = 6

const getEyeOpacity = (isClosed: boolean) => ({
    a: 1,
    k: [
        { t: source.ip, s: [isClosed ? 0 : 100], h: 1 },
        ...blinkFrames.flatMap(frame => [
            { t: frame, s: [isClosed ? 100 : 0], h: 1 },
            { t: frame + blinkDuration, s: [isClosed ? 0 : 100], h: 1 },
        ]),
        { t: source.op, s: [isClosed ? 0 : 100], h: 1 },
    ],
})

const createClosedEye = (isLeft: boolean, color: number[]) => ({
    ty: 'gr',
    nm: isLeft ? 'eye_L closed blink' : 'eye_R closed blink',
    it: [
        {
            ty: 'sh',
            ks: {
                a: 0,
                k: {
                    i: [
                        [0, 0],
                        [0, 0],
                        [0, 0],
                    ],
                    o: [
                        [0, 0],
                        [0, 0],
                        [0, 0],
                    ],
                    v: isLeft
                        ? [
                              [2, 5],
                              [23, 14.5],
                              [2, 24],
                          ]
                        : [
                              [23, 5],
                              [2, 14.5],
                              [23, 24],
                          ],
                    c: false,
                },
            },
        },
        {
            ty: 'st',
            c: { a: 0, k: color },
            o: { a: 0, k: 100 },
            w: { a: 0, k: 2.6 },
            lc: 2,
            lj: 2,
        },
        {
            ty: 'tr',
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: { a: 0, k: 0 },
            o: getEyeOpacity(true),
        },
    ],
})

// Bake visibility into Lottie keyframes so blinking follows playback, including loops.
export const remindersAnimation = {
    ...source,
    layers: source.layers.map(layer => {
        if (layer.ty !== 4 || !/^eye_[RL]$/.test(layer.nm)) return layer

        const eye = layer.shapes?.find(group => /^eye_/i.test(group.nm))
        const fill = eye?.it.find(item => item.ty === 'fl')
        if (!fill?.c) return layer

        return {
            ...layer,
            shapes: [
                ...(layer.shapes ?? []).map(group => ({
                    ...group,
                    it: group.it.map(item =>
                        item.ty === 'tr'
                            ? { ...item, o: getEyeOpacity(false) }
                            : item,
                    ),
                })),
                createClosedEye(layer.nm === 'eye_L', fill.c.k),
            ],
        }
    }),
    assets: source.assets.map(asset => ({
        ...asset,
        layers: asset.layers.map(layer =>
            // Null parents do not propagate opacity; hide the drawable back-face eyes too.
            layer.ty === 4 && /^(eye|iris)_[rl]$/i.test(layer.nm)
                ? { ...layer, ks: { ...layer.ks, o: getEyeOpacity(false) } }
                : layer,
        ),
    })),
}
