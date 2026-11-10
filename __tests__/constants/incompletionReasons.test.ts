import { findIncompletionReasonId } from '../../src/constants/incompletionReasons'

describe('findIncompletionReasonId', () => {
    it('resolves a reason code to the matching server catalog id', () => {
        expect(
            findIncompletionReasonId(
                [{ id: 'server-reason-1', description: '  NOT ENOUGH TIME ' }],
                'not_enough_time',
            ),
        ).toBe('server-reason-1')
    })

    it('returns no id when the server catalog does not contain the reason', () => {
        expect(
            findIncompletionReasonId(
                [{ id: 'server-reason-1', description: 'Low energy' }],
                'not_enough_time',
            ),
        ).toBeUndefined()
    })
})
