module.exports = {
    testEnvironment: 'jsdom',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
    testPathIgnorePatterns: ['/node_modules/', '/next-web/', '/pogoapi/'],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest'
    },
    setupFilesAfterEnv: ['<rootDir>/src/test-utils/setup.ts'],
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/*.stories.{ts,tsx}',
        '!src/test-utils/**/*',
        '!src/**/index.{ts,tsx}'
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    },
    moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@/components/(.*)$': '<rootDir>/src/components/$1',
        '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
        '^@/contexts/(.*)$': '<rootDir>/src/contexts/$1',
        '^@/services/(.*)$': '<rootDir>/src/services/$1',
        '^@/types/(.*)$': '<rootDir>/src/types/$1',
        '^@/lib/(.*)$': '<rootDir>/src/lib/$1'
    },
    testMatch: [
        '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
        '<rootDir>/src/**/*.{test,spec}.{ts,tsx}'
    ]
} 