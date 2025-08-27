import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
    const { baseURL } = config.projects[0].use;

    // Start browser and create context for setup
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // Navigate to the application
        await page.goto(baseURL);

        // Wait for the application to load
        await page.waitForLoadState('networkidle');

        // Check if the application is running
        const title = await page.title();
        console.log(`Application loaded with title: ${title}`);

        // Optional: Set up test data or perform initial setup
        // For example, create test users, seed database, etc.

        // Check if we need to create a test user
        try {
            await page.goto(`${baseURL}/login`);
            await page.waitForLoadState('networkidle');

            // If login page loads successfully, the app is ready
            console.log('Login page loaded successfully');
        } catch (error) {
            console.log('Login page not accessible, continuing with setup');
        }

    } catch (error) {
        console.error('Error during global setup:', error);
        throw error;
    } finally {
        await browser.close();
    }
}

export default globalSetup; 