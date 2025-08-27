# Testing Guide for Pogo React Application

This guide explains how to set up and run tests for the Pogo React application.

## Overview

The application uses a comprehensive testing strategy with:
- **Unit Tests**: Jest + React Testing Library for component and logic testing
- **E2E Tests**: Playwright for end-to-end user journey testing
- **Integration Tests**: Combined approach for testing component interactions

## Prerequisites

- Node.js 18+ and npm
- The application should be running on `http://localhost:3000` for E2E tests

## Installation

### 1. Install Testing Dependencies

```bash
# Install Jest and React Testing Library
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest ts-jest

# Install Playwright
npm install --save-dev @playwright/test

# Install Playwright browsers
npm run test:e2e:install
```

### 2. Verify Installation

```bash
# Check Jest version
npx jest --version

# Check Playwright version
npx playwright --version
```

## Running Tests

### Unit Tests (Jest)

```bash
# Run all unit tests
npm test

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode (no watch, with coverage)
npm run test:ci
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests in debug mode
npm run test:e2e:debug

# Run tests with UI mode
npm run test:e2e:ui

# Show test report
npm run test:report
```

### Combined Testing

```bash
# Run all tests (unit + E2E)
npm run test:all
```

## Test Structure

```
├── src/
│   ├── __tests__/                    # Jest test files
│   │   ├── components/              # Component tests
│   │   ├── hooks/                   # Hook tests
│   │   ├── contexts/                # Context tests
│   │   ├── services/                # Service tests
│   │   └── utils/                   # Utility tests
│   └── test-utils/                  # Test utilities
│       ├── setup.ts                 # Jest setup
│       └── test-utils.tsx          # Test helpers
├── playwright-tests/                 # Playwright E2E tests
│   ├── auth/                        # Authentication tests
│   ├── dashboard/                   # Dashboard tests
│   ├── chat/                        # Chat functionality tests
│   └── documents/                   # Document management tests
├── jest.config.js                   # Jest configuration
├── playwright.config.ts             # Playwright configuration
└── TEST_CASES.md                    # Comprehensive test cases
```

## Writing Tests

### Unit Tests (Jest + React Testing Library)

#### Component Test Example

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@/test-utils/test-utils';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles user interactions', () => {
    render(<MyComponent />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByText('Clicked!')).toBeInTheDocument();
  });
});
```

#### Hook Test Example

```tsx
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from '../useMyHook';

describe('useMyHook', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe(0);
  });

  it('updates state correctly', () => {
    const { result } = renderHook(() => useMyHook());
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.value).toBe(1);
  });
});
```

### E2E Tests (Playwright)

#### Test Example

```tsx
import { test, expect } from '@playwright/test';

test('user can login successfully', async ({ page }) => {
  await page.goto('/login');
  
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Login' }).click();
  
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByTestId('user-menu')).toBeVisible();
});
```

## Test Utilities

### Custom Render Function

The application provides a custom render function that includes all necessary providers:

```tsx
import { render } from '@/test-utils/test-utils';

// This automatically wraps components with ThemeProvider, AuthContext, etc.
render(<MyComponent />);
```

### Mock Data

Use the provided mock data factories:

```tsx
import { createMockUser, createMockProject } from '@/test-utils/test-utils';

const mockUser = createMockUser({ name: 'John Doe' });
const mockProject = createMockProject({ status: 'active' });
```

### API Mocking

Mock API calls using the provided utilities:

```tsx
import { mockFetch } from '@/test-utils/test-utils';

// Mock successful response
mockFetch({ data: 'success' });

// Mock error response
mockFetch({ error: 'Not found' }, 404);
```

## Configuration

### Jest Configuration

The Jest configuration is in `jest.config.js` and includes:
- TypeScript support with ts-jest
- jsdom environment for DOM testing
- Coverage thresholds (80% minimum)
- Path mapping for clean imports

### Playwright Configuration

The Playwright configuration is in `playwright.config.ts` and includes:
- Multiple browser and device testing
- Screenshot and video capture on failure
- Global setup and teardown
- Web server management

## Best Practices

### Unit Testing
- Test component behavior, not implementation
- Use meaningful test descriptions
- Test edge cases and error scenarios
- Mock external dependencies
- Keep tests focused and isolated

### E2E Testing
- Test user workflows, not technical details
- Use page object models for complex pages
- Test across different devices and browsers
- Focus on critical user paths
- Maintain test stability

### Test Data
- Use factories for generating test data
- Ensure mock data covers edge cases
- Maintain consistency across test files
- Clean up test data after tests

## Debugging Tests

### Jest Debugging

```bash
# Run specific test file
npm test -- MyComponent.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="login"

# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Playwright Debugging

```bash
# Run tests in debug mode
npm run test:e2e:debug

# Run tests with UI mode
npm run test:e2e:ui

# Run specific test
npx playwright test login.spec.ts
```

## Continuous Integration

### GitHub Actions

The tests are configured to run automatically:
- On every push to main branch
- On pull requests
- With coverage reporting
- With E2E tests on staging environment

### Pre-commit Hooks

Consider setting up pre-commit hooks to:
- Run linting
- Run unit tests
- Check test coverage
- Format code

## Coverage Goals

- **Unit Tests**: 80% minimum coverage
- **Integration Tests**: 70% minimum coverage
- **E2E Tests**: Cover all critical user journeys
- **Accessibility Tests**: 100% coverage for WCAG compliance

## Troubleshooting

### Common Issues

1. **Tests not finding components**
   - Check import paths
   - Verify component exports
   - Check Jest module mapping

2. **Playwright tests failing**
   - Ensure app is running on localhost:3000
   - Check browser installation
   - Verify test selectors

3. **Coverage not generating**
   - Check Jest configuration
   - Verify coverage thresholds
   - Check file exclusions

### Getting Help

- Check the test output for detailed error messages
- Review the test configuration files
- Consult the TEST_CASES.md for test scenarios
- Check Playwright and Jest documentation

## Performance Testing

### Component Performance
- Test render times
- Test memory usage
- Test bundle size impact

### Application Performance
- Test page load times
- Test API response times
- Test real-time feature performance

## Accessibility Testing

### Automated Testing
- Test ARIA labels
- Test keyboard navigation
- Test color contrast
- Test screen reader compatibility

### Manual Testing
- Test with screen readers
- Test keyboard-only navigation
- Test with different zoom levels
- Test with high contrast themes

This testing setup ensures the Pogo React application is thoroughly tested across all layers, providing confidence in code quality and user experience. 