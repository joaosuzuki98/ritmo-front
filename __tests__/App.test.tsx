jest.mock('@react-navigation/native', () => ({
    NavigationContainer: ({ children }: { children: unknown }) => children,
    createNavigationContainerRef: () => ({}),
}))
jest.mock('@react-navigation/bottom-tabs', () => ({
    createBottomTabNavigator: () => ({
        Navigator: ({ children }: { children: unknown }) => children,
        Screen: ({ children }: { children: () => unknown }) => children(),
    }),
}))

import App from '../App'

jest.mock('../src/database', () => ({
    database: {
        get: () => ({
            find: jest.fn().mockResolvedValue(null),
            query: () => ({ fetch: jest.fn().mockResolvedValue([]) }),
        }),
    },
}))

describe('App', () => {
    it('exports the navigation shell component', () => {
        expect(App).toBeDefined()
    })
})
