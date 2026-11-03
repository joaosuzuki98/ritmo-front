import {
    buildFocusHabitGroups,
    getSelectedFocusGroups,
} from '../../../src/screens/StartYourDay/focusHabitGroups'

const habit = (
    id: string,
    name = id,
    userId = 'user',
    isFocusOfDay = false,
) => ({
    id,
    name,
    userId,
    status: 'pending',
    isFocusOfDay,
})
const condition = (habitId: string, conditionHabitId: string) => ({
    habitId,
    conditionHabitId,
    conditionType: 'habit_status',
})
const dependency = (habitId: string, triggerHabitId: string) => ({
    habitId,
    triggerHabitId,
    type: 'after_completion',
})

describe('focus habit hierarchy', () => {
    it('places parents before children regardless of input order, with deeper indentation for descendants', () => {
        const groups = buildFocusHabitGroups(
            [
                habit('water', 'water', 'user', true),
                habit('read', 'read', 'user', true),
                habit('walk', 'walk', 'user', true),
                habit('bath', 'bath', 'user', true),
                habit('sleep', 'sleep', 'user', true),
            ],
            [condition('water', 'walk'), condition('sleep', 'bath')],
            [dependency('bath', 'walk')],
            'user',
        )
        expect(
            groups.map(group =>
                group.entries.map(entry => [
                    entry.id,
                    entry.depth,
                    entry.isLastChild,
                ]),
            ),
        ).toEqual([
            [['read', 0, false]],
            [
                ['walk', 0, false],
                ['water', 1, false],
                ['bath', 1, true],
                ['sleep', 2, true],
            ],
        ])
        expect(getSelectedFocusGroups(groups)).toEqual([
            { id: 'read', labels: ['read'] },
            { id: 'walk', labels: ['walk', 'water', 'bath', 'sleep'] },
        ])
        const partiallySelectedGroups = buildFocusHabitGroups(
            [
                habit('water', 'water', 'user', true),
                habit('read'),
                habit('walk'),
                habit('bath', 'bath', 'user', true),
                habit('sleep'),
            ],
            [condition('water', 'walk'), condition('sleep', 'bath')],
            [dependency('bath', 'walk')],
            'user',
        )
        expect(getSelectedFocusGroups(partiallySelectedGroups)).toEqual([
            { id: 'walk', labels: ['water', 'bath'] },
        ])
        expect(
            getSelectedFocusGroups(
                buildFocusHabitGroups(
                    [habit('water'), habit('read'), habit('walk')],
                    [condition('water', 'walk')],
                    [],
                    'user',
                ),
            ),
        ).toEqual([])
    })

    it('does not group unrelated habits with the same name or expose other users or deleted parents', () => {
        const groups = buildFocusHabitGroups(
            [
                habit('a', 'Caminhar'),
                habit('b', 'Caminhar'),
                habit('foreign', 'Foreign', 'other'),
                { ...habit('deleted'), status: 'deleted' },
                habit('blank', ' '),
            ],
            [condition('a', 'foreign'), condition('b', 'missing')],
            [dependency('b', 'deleted')],
            'user',
        )
        expect(
            groups.map(group => group.entries.map(entry => entry.id)),
        ).toEqual([['a'], ['b']])
    })

    it('deduplicates overlapping relation types and keeps a child visible under both distinct parents', () => {
        const groups = buildFocusHabitGroups(
            [habit('a'), habit('b'), habit('child')],
            [condition('child', 'a')],
            [dependency('child', 'a'), dependency('child', 'b')],
            'user',
        )
        expect(
            groups.map(group => group.entries.map(entry => entry.id)),
        ).toEqual([
            ['a', 'child'],
            ['b', 'child'],
        ])
    })

    it('handles cycles without dropping habits or repeating them within a group', () => {
        const groups = buildFocusHabitGroups(
            [habit('a'), habit('b'), habit('c')],
            [condition('a', 'b'), condition('b', 'a'), condition('c', 'c')],
            [],
            'user',
        )
        expect(
            groups.map(group => group.entries.map(entry => entry.id)),
        ).toEqual([['c'], ['a', 'b']])
    })
})
