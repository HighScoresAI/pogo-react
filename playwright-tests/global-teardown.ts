import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
    console.log('Cleaning up test environment...');

    try {
        // Clean up any test data created during testing
        // For example, remove test users, clear test database, etc.

        // Clean up test files or temporary data
        console.log('Test environment cleanup completed');

    } catch (error) {
        console.error('Error during global teardown:', error);
        // Don't throw error during teardown to avoid masking test failures
    }
}

export default globalTeardown; 