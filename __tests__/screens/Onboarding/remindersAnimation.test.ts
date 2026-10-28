import source from '../../../src/assets/animations/moon_reminders_and_todo.json'
import { remindersAnimation } from '../../../src/screens/Onboarding/remindersAnimation'

type Opacity = {
    a: number
    k: number | { t: number; s: number[]; h?: number }[]
}

const opacityAt = (opacity: Opacity, frame: number) => {
    if (typeof opacity.k === 'number') return opacity.k

    const keyframe = opacity.k.filter(key => key.t <= frame).pop()
    expect(keyframe?.h).toBe(1)
    return keyframe?.s[0] ?? 0
}

describe('remindersAnimation', () => {
    it.each(['eye_L', 'eye_R'])(
        'blinks %s three times only while looking at the bell, without overlapping eyes',
        name => {
            const eye = remindersAnimation.layers.find(
                layer => layer.nm === name,
            )
            const groups = eye?.shapes ?? []
            expect(groups).toHaveLength(3)

            const opacities = groups.map(group => {
                const transform = group.it.find(item => item.ty === 'tr')
                if (!transform || !('o' in transform) || !transform.o) {
                    throw new Error(`Missing eye opacity: ${group.nm}`)
                }
                return { name: group.nm, opacity: transform.o }
            })
            const closed = opacities.find(group =>
                group.name.includes('closed'),
            )!
            const open = opacities.filter(group => group !== closed)
            expect(open).toHaveLength(2)

            let wasClosed = false
            let blinkCount = 0
            for (let frame = source.ip; frame < source.op; frame += 0.5) {
                const isClosed = opacityAt(closed.opacity, frame) === 100
                if (isClosed && !wasClosed) blinkCount += 1
                if (isClosed) {
                    expect(frame).toBeGreaterThanOrEqual(102)
                    expect(frame).toBeLessThan(150)
                }
                for (const group of open) {
                    expect(opacityAt(group.opacity, frame)).toBe(
                        isClosed ? 0 : 100,
                    )
                }
                wasClosed = isClosed
            }
            expect(blinkCount).toBe(3)
            expect(wasClosed).toBe(false)
            expect(opacityAt(closed.opacity, source.ip)).toBe(0)
        },
    )

    it('hides all drawable back-face eyes during the same blink intervals', () => {
        const eyes = remindersAnimation.assets.flatMap(asset =>
            asset.layers.filter(
                layer => layer.ty === 4 && /^(eye|iris)_[rl]$/i.test(layer.nm),
            ),
        )
        expect(eyes).toHaveLength(4)
        for (const eye of eyes) {
            for (const frame of [108, 120, 132]) {
                expect(opacityAt(eye.ks.o, frame)).toBe(0)
                expect(opacityAt(eye.ks.o, frame + 6)).toBe(100)
            }
        }
    })

    it('preserves the exported motion, masks and original source', () => {
        expect(remindersAnimation.fr).toBe(source.fr)
        expect(remindersAnimation.op).toBe(source.op)
        remindersAnimation.layers.forEach((layer, index) => {
            expect(layer.ks).toEqual(source.layers[index].ks)
            expect(layer.tt).toBe(source.layers[index].tt)
            expect(layer.parent).toBe(source.layers[index].parent)
            if (/^eye_[RL]$/.test(layer.nm)) {
                expect(source.layers[index].shapes).toHaveLength(2)
            } else {
                expect(layer).toEqual(source.layers[index])
            }
        })
        for (const asset of source.assets) {
            for (const layer of asset.layers) {
                expect(layer.ks.o.a).toBe(0)
            }
        }
    })
})
