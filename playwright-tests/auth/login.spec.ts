import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to login page before each test
        await page.goto('/login');
    });

    test('should display login form with all required elements', async ({ page }) => {
        // Check if login form is visible
        await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();

        // Check if email input is present
        await expect(page.getByLabel(/email/i)).toBeVisible();

        // Check if password input is present
        await expect(page.getByLabel(/password/i)).toBeVisible();

        // Check if login button is present
        await expect(page.getByRole('button', { name: /login/i })).toBeVisible();

        // Check if "forgot password" link is present
        await expect(page.getByRole('link', { name: /forgot password/i })).toBeVisible();

        // Check if "register" link is present
        await expect(page.getByRole('link', { name: /register/i })).toBeVisible();
    });

    test('should show validation errors for empty form submission', async ({ page }) => {
        // Click login button without entering any data
        await page.getByRole('button', { name: /login/i }).click();

        // Check if validation errors are displayed
        await expect(page.getByText(/email is required/i)).toBeVisible();
        await expect(page.getByText(/password is required/i)).toBeVisible();
    });

    test('should show validation error for invalid email format', async ({ page }) => {
        // Enter invalid email format
        await page.getByLabel(/email/i).fill('invalid-email');
        await page.getByLabel(/password/i).fill('password123');

        // Click login button
        await page.getByRole('button', { name: /login/i }).click();

        // Check if email validation error is displayed
        await expect(page.getByText(/please enter a valid email/i)).toBeVisible();
    });

    test('should show validation error for short password', async ({ page }) => {
        // Enter valid email but short password
        await page.getByLabel(/email/i).fill('test@example.com');
        await page.getByLabel(/password/i).fill('123');

        // Click login button
        await page.getByRole('button', { name: /login/i }).click();

        // Check if password validation error is displayed
        await expect(page.getByText(/password must be at least 6 characters/i)).toBeVisible();
    });

    test('should show loading state during login process', async ({ page }) => {
        // Enter valid credentials
        await page.getByLabel(/email/i).fill('test@example.com');
        await page.getByLabel(/password/i).fill('password123');

        // Click login button
        await page.getByRole('button', { name: /login/i }).click();

        // Check if loading state is displayed
        await expect(page.getByTestId('loading-spinner')).toBeVisible();

        // Check if button is disabled during loading
        await expect(page.getByRole('button', { name: /login/i })).toBeDisabled();
    });

    test('should show error message for invalid credentials', async ({ page }) => {
        // Mock failed login response
        await page.route('/api/auth/login', async route => {
            await route.fulfill({
                status: 401,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Invalid email or password' })
            });
        });

        // Enter invalid credentials
        await page.getByLabel(/email/i).fill('wrong@example.com');
        await page.getByLabel(/password/i).fill('wrongpassword');

        // Click login button
        await page.getByRole('button', { name: /login/i }).click();

        // Wait for error message to appear
        await expect(page.getByText(/invalid email or password/i)).toBeVisible();
    });

    test('should show error message for network/server errors', async ({ page }) => {
        // Mock server error response
        await page.route('/api/auth/login', async route => {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Internal server error' })
            });
        });

        // Enter valid credentials
        await page.getByLabel(/email/i).fill('test@example.com');
        await page.getByLabel(/password/i).fill('password123');

        // Click login button
        await page.getByRole('button', { name: /login/i }).click();

        // Wait for error message to appear
        await expect(page.getByText(/internal server error/i)).toBeVisible();
    });

    test('should successfully login with valid credentials', async ({ page }) => {
        // Mock successful login response
        await page.route('/api/auth/login', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    user: {
                        id: '1',
                        email: 'test@example.com',
                        name: 'Test User',
                        token: 'mock-jwt-token'
                    }
                })
            });
        });

        // Enter valid credentials
        await page.getByLabel(/email/i).fill('test@example.com');
        await page.getByLabel(/password/i).fill('password123');

        // Click login button
        await page.getByRole('button', { name: /login/i }).click();

        // Wait for redirect to dashboard
        await expect(page).toHaveURL('/dashboard');

        // Check if user is logged in (e.g., user menu is visible)
        await expect(page.getByTestId('user-menu')).toBeVisible();
    });

    test('should redirect to intended page after login', async ({ page }) => {
        // Navigate to a protected page first
        await page.goto('/projects');

        // Should be redirected to login page
        await expect(page).toHaveURL('/login');

        // Mock successful login response
        await page.route('/api/auth/login', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    user: {
                        id: '1',
                        email: 'test@example.com',
                        name: 'Test User',
                        token: 'mock-jwt-token'
                    }
                })
            });
        });

        // Login with valid credentials
        await page.getByLabel(/email/i).fill('test@example.com');
        await page.getByLabel(/password/i).fill('password123');
        await page.getByRole('button', { name: /login/i }).click();

        // Should be redirected back to intended page
        await expect(page).toHaveURL('/projects');
    });

    test('should remember user preference for "remember me"', async ({ page }) => {
        // Check if remember me checkbox is present
        await expect(page.getByLabel(/remember me/i)).toBeVisible();

        // Check the remember me checkbox
        await page.getByLabel(/remember me/i).check();

        // Mock successful login response
        await page.route('/api/auth/login', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    user: {
                        id: '1',
                        email: 'test@example.com',
                        name: 'Test User',
                        token: 'mock-jwt-token'
                    }
                })
            });
        });

        // Login with valid credentials
        await page.getByLabel(/email/i).fill('test@example.com');
        await page.getByLabel(/password/i).fill('password123');
        await page.getByRole('button', { name: /login/i }).click();

        // Wait for redirect
        await expect(page).toHaveURL('/dashboard');

        // Close browser and reopen to test persistence
        await page.context().close();

        // Create new context and navigate to protected page
        const newContext = await page.context().browser()?.newContext();
        const newPage = await newContext?.newPage();

        if (newPage) {
            await newPage.goto('/dashboard');

            // Should still be logged in if remember me worked
            await expect(newPage).toHaveURL('/dashboard');
            await expect(newPage.getByTestId('user-menu')).toBeVisible();
        }
    });

    test('should handle keyboard navigation properly', async ({ page }) => {
        // Tab through form elements
        await page.keyboard.press('Tab');
        await expect(page.getByLabel(/email/i)).toHaveFocus();

        await page.keyboard.press('Tab');
        await expect(page.getByLabel(/password/i)).toHaveFocus();

        await page.keyboard.press('Tab');
        await expect(page.getByRole('button', { name: /login/i })).toHaveFocus();

        // Test Enter key on focused elements
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await expect(page.getByLabel(/email/i)).toHaveFocus();

        // Type email and press Enter to move to password
        await page.getByLabel(/email/i).fill('test@example.com');
        await page.keyboard.press('Enter');
        await expect(page.getByLabel(/password/i)).toHaveFocus();

        // Type password and press Enter to submit
        await page.getByLabel(/password/i).fill('password123');
        await page.keyboard.press('Enter');

        // Should attempt to submit form
        await expect(page.getByRole('button', { name: /login/i })).toBeDisabled();
    });

    test('should be accessible with screen readers', async ({ page }) => {
        // Check if form has proper ARIA labels
        await expect(page.getByLabel(/email/i)).toHaveAttribute('aria-required', 'true');
        await expect(page.getByLabel(/password/i)).toHaveAttribute('aria-required', 'true');

        // Check if error messages have proper ARIA attributes
        await page.getByRole('button', { name: /login/i }).click();

        await expect(page.getByText(/email is required/i)).toHaveAttribute('role', 'alert');
        await expect(page.getByText(/password is required/i)).toHaveAttribute('role', 'alert');
    });

    test('should work correctly on mobile devices', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });

        // Check if form elements are properly sized for mobile
        const emailInput = page.getByLabel(/email/i);
        const passwordInput = page.getByLabel(/password/i);
        const loginButton = page.getByRole('button', { name: /login/i });

        // Verify elements are visible and properly sized
        await expect(emailInput).toBeVisible();
        await expect(passwordInput).toBeVisible();
        await expect(loginButton).toBeVisible();

        // Test touch interactions
        await emailInput.tap();
        await emailInput.fill('test@example.com');

        await passwordInput.tap();
        await passwordInput.fill('password123');

        await loginButton.tap();

        // Should attempt to submit form
        await expect(loginButton).toBeDisabled();
    });
}); 