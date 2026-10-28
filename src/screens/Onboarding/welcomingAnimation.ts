import welcomingSource from '../../assets/animations/moon_welcoming.json'
import idleSource from '../../assets/animations/moon_idle_happy.json'

export const welcomingIdleStartFrame = welcomingSource.op
export const welcomingEndFrame = welcomingIdleStartFrame + idleSource.op

// Both exports use asset_1; keep references local to their original composition.
const namespaceLayer = <T extends object>(layer: T, prefix: string): T => {
    if ('refId' in layer && typeof layer.refId === 'string') {
        return { ...layer, refId: `${prefix}${layer.refId}` }
    }
    return layer
}

const createPhase = (
    refId: string,
    index: number,
    startFrame: number,
    endFrame: number,
    width: number,
) => ({
    ddd: 0,
    ind: index,
    ty: 0,
    nm: refId,
    refId,
    sr: 1,
    ip: startFrame,
    op: endFrame,
    st: startFrame,
    w: width,
    h: welcomingSource.h,
    ks: {
        p: { a: 0, k: [(welcomingSource.w - width) / 2, 0] },
        a: { a: 0, k: [0, 0] },
        s: { a: 0, k: [100, 100] },
        r: { a: 0, k: 0 },
        o: { a: 0, k: 100 },
    },
})

// Use one native timeline: the idle starts on the exact frame the welcome ends.
export const welcomingAnimation = {
    ...welcomingSource,
    nm: 'moon_welcoming_to_idle',
    op: welcomingEndFrame,
    assets: [
        ...welcomingSource.assets.map(asset => ({
            ...asset,
            id: `welcoming-${asset.id}`,
            layers: asset.layers.map(layer =>
                namespaceLayer(layer, 'welcoming-'),
            ),
        })),
        ...idleSource.assets.map(asset => ({
            ...asset,
            id: `idle-${asset.id}`,
            layers: asset.layers.map(layer => namespaceLayer(layer, 'idle-')),
        })),
        {
            id: 'welcoming-root',
            w: welcomingSource.w,
            h: welcomingSource.h,
            layers: welcomingSource.layers.map(layer =>
                namespaceLayer(layer, 'welcoming-'),
            ),
        },
        {
            id: 'idle-root',
            w: idleSource.w,
            h: idleSource.h,
            layers: idleSource.layers.map(layer =>
                namespaceLayer(layer, 'idle-'),
            ),
        },
    ],
    layers: [
        createPhase(
            'welcoming-root',
            1,
            0,
            welcomingIdleStartFrame,
            welcomingSource.w,
        ),
        createPhase(
            'idle-root',
            2,
            welcomingIdleStartFrame,
            welcomingEndFrame,
            idleSource.w,
        ),
    ],
}
