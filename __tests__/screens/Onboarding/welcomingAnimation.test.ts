import welcomingSource from '../../../src/assets/animations/moon_welcoming.json'
import idleSource from '../../../src/assets/animations/moon_idle_happy.json'
import {
    welcomingAnimation,
    welcomingEndFrame,
    welcomingIdleStartFrame,
} from '../../../src/screens/Onboarding/welcomingAnimation'

describe('welcomingAnimation', () => {
    it('joins both phases without a gap or overlap on the native timeline', () => {
        const [welcome, idle] = welcomingAnimation.layers
        expect(welcomingSource.fr).toBe(idleSource.fr)
        expect(welcomingSource.ip).toBe(0)
        expect(idleSource.ip).toBe(0)
        expect(welcome.ip).toBe(0)
        expect(welcome.op).toBe(idle.ip)
        expect(idle.ip).toBe(welcomingIdleStartFrame)
        expect(idle.st).toBe(idle.ip)
        expect(idle.op - idle.ip).toBe(idleSource.op)
        expect(idle.op).toBe(welcomingEndFrame)
        expect(welcomingAnimation.op).toBe(idle.op)
    })

    it('keeps the idle centered at the same scale as the final welcoming pose', () => {
        const [welcome, idle] = welcomingAnimation.layers
        expect(welcomingAnimation.w).toBe(welcomingSource.w)
        expect(welcomingSource.h).toBe(idleSource.h)
        expect(welcome.ks.p.k).toEqual([0, 0])
        expect(idle.ks.p.k).toEqual([(welcomingSource.w - idleSource.w) / 2, 0])
        expect(idle.ks.s).toEqual(welcome.ks.s)
        expect(idle.ks.o.k).toBe(100)
    })

    it('resolves all precomposition references without collisions between the exports', () => {
        const assets = welcomingAnimation.assets
        const assetIds = assets.map(asset => asset.id)
        expect(new Set(assetIds).size).toBe(assets.length)
        const layers = [
            ...welcomingAnimation.layers,
            ...assets.flatMap<object>(asset => asset.layers),
        ]
        for (const layer of layers) {
            if ('refId' in layer) {
                expect(assetIds).toContain(layer.refId)
            }
        }
        expect(welcomingSource.assets[0].id).toBe('asset_1')
        expect(idleSource.assets[0].id).toBe('asset_1')
    })
})
