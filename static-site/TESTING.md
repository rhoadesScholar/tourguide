# Testing Guide for Static Site

This document describes the testing strategy and how to run tests for the Neuroglancer Tourguide static site.

## Test Suite Overview

The test suite includes:
- **Unit Tests**: Jest-based tests for JavaScript functions and modules
- **E2E Tests**: Playwright tests for end-to-end user workflows
- **Linting**: ESLint for code quality
- **HTML Validation**: HTML5 validator
- **Security Scanning**: npm audit for dependency vulnerabilities

## Running Tests Locally

### Prerequisites

```bash
cd static-site
npm install
```

### Unit Tests

Run all unit tests:
```bash
npm test
```

Run tests in watch mode (for development):
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm test -- --coverage
```

Coverage reports are generated in `coverage/` directory.

### E2E Tests

Run all E2E tests:
```bash
npm run test:e2e
```

Run E2E tests with browser UI visible:
```bash
npm run test:e2e:headed
```

Run tests for specific browser:
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Linting

Check code style:
```bash
npm run lint:check
```

Auto-fix linting issues:
```bash
npm run lint
```

### Run All Tests

```bash
npm run test:all
```

## Test Structure

```
static-site/
├── __tests__/
│   ├── setup.js                    # Jest setup and mocks
│   ├── organelle-data.test.js      # Unit tests for data manager
│   ├── app.test.js                 # Unit tests for app logic
│   └── e2e/
│       └── app.spec.js             # E2E tests for UI
├── jest.config.js                  # Jest configuration
├── playwright.config.js            # Playwright configuration
└── .eslintrc.js                    # ESLint configuration
```

## Unit Tests

### OrganelleDataManager Tests

Tests for the CSV data manager:
- CSV parsing (numbers, strings, empty values)
- Data loading and caching
- Filtering and querying
- Statistics calculation
- Sorting and limiting results
- Error handling

### App Logic Tests

Tests for application configuration and state:
- CONFIG object validation
- Dataset configurations
- API configuration storage
- State management
- Error handling
- Data validation

## E2E Tests

### Basic Functionality
- Homepage loading
- UI component visibility
- Dataset selector

### Mode Switching
- Explore/Query/Analysis mode transitions
- Active state updates

### API Settings Modal
- Modal open/close
- Provider tab switching
- Security warning display

### Explore Mode
- Tab switching
- Screenshot capture button

### Query Mode
- Input and submit functionality
- Example queries display

### Analysis Mode
- Input and submit functionality
- Example analyses display

### Accessibility
- Heading hierarchy
- Alt text for images

### Responsive Design
- Mobile viewport
- Tablet viewport

## CI/CD Integration

### GitHub Actions Workflow

The `.github/workflows/test-static-site.yml` workflow runs:

1. **Lint Job**: Code style checking
2. **Unit Tests Job**: Jest tests with coverage
3. **E2E Tests Job**: Playwright tests (matrix: chromium, firefox, webkit)
4. **Validate HTML Job**: HTML5 validation
5. **Security Scan Job**: npm audit
6. **Test Summary Job**: Aggregate results

### Triggers

Tests run on:
- Push to `main` branch (when static-site/ files change)
- Push to `copilot/**` branches
- Pull requests to `main` branch

### Artifacts

- Test coverage reports (uploaded to Codecov)
- Playwright test results (artifacts retained for 30 days)
- HTML validation results

## Coverage Goals

Minimum coverage thresholds (defined in jest.config.js):
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

## Writing New Tests

### Unit Test Example

```javascript
describe('MyFunction', () => {
  test('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### E2E Test Example

```javascript
test('should click button', async ({ page }) => {
  await page.goto('/');
  await page.locator('#my-button').click();
  await expect(page.locator('#result')).toBeVisible();
});
```

## Debugging Tests

### Unit Tests

Run specific test file:
```bash
npm test -- organelle-data.test.js
```

Run specific test:
```bash
npm test -- -t "should parse valid CSV"
```

### E2E Tests

Run with UI:
```bash
npm run test:e2e:headed
```

Debug specific test:
```bash
npx playwright test --debug app.spec.js
```

View trace:
```bash
npx playwright show-trace trace.zip
```

## Continuous Integration

### Status Badges

Add to README.md:
```markdown
![Tests](https://github.com/rhoadesScholar/tourguide/workflows/Test%20Static%20Site/badge.svg)
```

### Branch Protection

Recommended settings:
- Require status checks to pass before merging
- Required checks: unit-tests, e2e-tests
- Require branches to be up to date

## Best Practices

1. **Test Organization**: Group related tests in `describe` blocks
2. **Test Isolation**: Each test should be independent
3. **Mocking**: Mock external dependencies (fetch, localStorage)
4. **Assertions**: Use specific matchers (toHaveLength, toContainText)
5. **Async Tests**: Always await async operations
6. **Coverage**: Aim for high coverage, but focus on critical paths
7. **Maintenance**: Keep tests updated with code changes
8. **Documentation**: Document complex test scenarios

## Troubleshooting

### Tests Failing Locally

1. Clear caches: `npm run test -- --clearCache`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check Node.js version: `node --version` (should be 20+)

### E2E Tests Timing Out

1. Increase timeout in playwright.config.js
2. Use `page.waitForLoadState()` for async operations
3. Check if webServer is starting correctly

### Coverage Issues

1. Ensure all files are included in `collectCoverageFrom`
2. Check for uncovered branches
3. Add tests for edge cases

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [ESLint Documentation](https://eslint.org/docs/latest/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Support

For issues or questions about testing:
1. Check existing test files for examples
2. Review documentation above
3. Check GitHub Actions logs for CI failures
4. Open an issue on GitHub
