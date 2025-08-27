import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './playwright-tests',
    testIgnore: ['**/node_modules/**', '**/next-web/**', '**/pogoapi/**'],
    timeout: 30000,
    expect: {
        timeout: 5000
    },
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [
        ['list'],
        ['html', { open: 'never' }],
        ['json', { outputFile: 'test-results/results.json' }]
    ],
    use: {
        actionTimeout: 0,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        baseURL: process.env.BASE_URL || 'http://localhost:3000',
    },
    projects: [
        // Desktop browsers
        {
            name: 'Chromium',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1280, height: 720 }
            },
        },
        {
            name: 'Firefox',
            use: {
                ...devices['Desktop Firefox'],
                viewport: { width: 1280, height: 720 }
            },
        },
        {
            name: 'WebKit',
            use: {
                ...devices['Desktop Safari'],
                viewport: { width: 1280, height: 720 }
            },
        },

        // Tablet devices
        {
            name: 'iPad',
            use: {
                ...devices['iPad (gen 7)'],
                viewport: { width: 1024, height: 768 }
            },
        },

        // Mobile devices
        {
            name: 'Mobile Chrome',
            use: {
                ...devices['Pixel 5'],
                viewport: { width: 375, height: 667 }
            },
        },
        {
            name: 'Mobile Safari',
            use: {
                ...devices['iPhone 12'],
                viewport: { width: 375, height: 812 }
            },
        },

        // Large screens
        {
            name: 'Large Desktop',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1920, height: 1080 }
            },
        },
    ],

    // Global setup and teardown
    globalSetup: require.resolve('./playwright-tests/global-setup.ts'),
    globalTeardown: require.resolve('./playwright-tests/global-teardown.ts'),

    // Test output directory
    outputDir: 'test-results/',

    // Environment variables
    env: {
        NODE_ENV: 'test',
        CI: process.env.CI || 'false',
    },

    // Web server configuration for testing
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
    },
}); 