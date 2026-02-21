# Enhanced Page Object Model - Agent Instructions

## Overview

This document provides comprehensive instructions for AI agents and developers working with the enhanced Playwright page object model for CasaOS testing automation.

## Architecture

```
tests/
├── pages/
│   ├── basePage.ts           # Base class with common functionality
│   ├── casaOSPageEnhanced.ts # Enhanced CasaOS interactions
│   ├── scrutinyPage.ts       # Scrutiny drive monitoring
│   ├── jellyfinPage.ts       # Jellyfin media server
│   └── collectionsPage.ts    # Jellyfin collections
├── config/
│   └── credentials.ts        # Credential management
└── *.spec.ts                 # Test files
```

## Key Principles for Agents

### 1. Always Use Base Class Pattern
- **Inherit from BasePage** for any new page objects
- **Use built-in logging** methods (`this.log()`, `this.logError()`)
- **Leverage enhanced navigation** (`navigateTo()`, `waitForElement()`)
- **Use error handling** patterns consistently

### 2. Robust Selector Strategies
```typescript
// ✅ GOOD: Multiple fallback selectors
private readonly selectors = {
  loginButton: 'button:has-text("Sign in"), button:has-text("Login"), button:has-text("Log in")',
  searchInput: 'input[placeholder="Search..."], input[placeholder="Search"]'
};

// ❌ AVOID: Single brittle selector
private readonly loginButton = '#login-btn';
```

### 3. Enhanced Waiting Patterns
```typescript
// ✅ GOOD: Use base class methods with proper timeouts
await this.waitForElement(selector, { timeout: 15000, state: 'visible' });

// ✅ GOOD: Wait for multiple possible elements
const { locator } = await this.waitForAnyElement([
  'text=Dashboard',
  'text=Home',
  'h1:has-text("Welcome")'
]);

// ❌ AVOID: Basic Playwright waits without error handling
await page.waitForSelector(selector);
```

### 4. Generic Container Handling
```typescript
// ✅ GOOD: Use the enhanced CasaOS container launcher
const scrutinyPage = await casaOS.launchContainer('scrutiny');
const jellyfinPage = await casaOS.launchContainer('jellyfin');

// ✅ GOOD: Fallback for unknown containers
const customPage = await casaOS.launchContainer('custom-app-name');
```

### 5. Type Safety and Interfaces
```typescript
// ✅ GOOD: Define interfaces for data structures
interface DriveInfo {
  device: string;
  status: string;
  temperature: string;
  // ...
}

async getAllDriveInfo(): Promise<DriveInfo[]> {
  // Implementation with proper typing
}
```

## Test Writing Guidelines for Agents

### Standard Test Structure
```typescript
import { test, expect } from '@playwright/test';
import { CasaOSPage } from './pages/casaOSPageEnhanced';
import { ScrutinyPage } from './pages/scrutinyPage';
import { credentials } from './config/credentials';

test.describe('Feature Name', () => {
  test('specific functionality test', async ({ page }) => {
    // 1. Setup - Always use page objects
    const casaOS = new CasaOSPage(page);
    await casaOS.gotoLogin();
    await casaOS.login(credentials.casaos.username, credentials.casaos.password);
    await casaOS.expectDashboard();

    // 2. Action - Use container launcher for apps
    const scrutinyPage = await casaOS.launchContainer('scrutiny');
    const scrutiny = new ScrutinyPage(scrutinyPage);
    await scrutiny.waitForDashboard();

    // 3. Validation - Use page object methods
    const driveCount = await scrutiny.getDriveCount();
    expect(driveCount).toBeGreaterThan(0);

    // 4. Output - Use built-in export/logging
    await scrutiny.printDriveInfo('standard');
    
    // 5. Cleanup - Automatic with page objects
  });
});
```

### Error Handling Best Practices
```typescript
// ✅ GOOD: Use try-catch with proper logging
try {
  await this.waitForElement(selector);
  this.log('✓ Element found successfully');
} catch (error) {
  this.logError('Element not found', error);
  // Provide fallback or rethrow
  throw error;
}

// ✅ GOOD: Use element existence checks
if (await this.elementExists(selector)) {
  // Element exists, proceed
} else {
  // Handle absence gracefully
  this.log('⚠ Element not found, using fallback');
}
```

## Container Integration Patterns

### Adding New Container Support

When agents need to support a new CasaOS container:

1. **Add to container mappings** in `casaOSPageEnhanced.ts`:
```typescript
private readonly containerMappings = {
  newContainer: {
    names: ['new-container', 'alt-name'],
    selector: '#app-new-container, [data-app="new-container"]',
    expectedPort: '8080'
  }
};
```

2. **Create dedicated page object** following the pattern:
```typescript
export class NewContainerPage extends BasePage {
  private readonly selectors = {
    // Define selectors
  };

  constructor(page: Page) {
    super(page);
  }

  async waitForApplication(): Promise<void> {
    // Implementation
  }
}
```

3. **Update test to use new page object**:
```typescript
const newAppPage = await casaOS.launchContainer('newContainer');
const newApp = new NewContainerPage(newAppPage);
await newApp.waitForApplication();
```

## Debugging and Diagnostics

### Agent Debugging Features
```typescript
// Take diagnostic screenshots
await this.takeScreenshot('debug-state');

// Log detailed information
this.log('Current URL: ' + this.page.url());
this.log('Page title: ' + await this.page.title());

// Export data for analysis
const data = await scrutiny.getAllDriveInfo();
await scrutiny.exportDriveData('debug-drives.txt');

// Check element visibility
const isVisible = await this.elementExists(selector);
this.log(`Element ${selector} visible: ${isVisible}`);
```

### Common Troubleshooting

1. **Authentication Issues**:
   - Check credentials in `.env` file
   - Verify server accessibility at `http://192.168.1.231`
   - Use `casaOS.validateSystemHealth()` to check status

2. **Container Launch Issues**:
   - Verify container is running in CasaOS
   - Check port mappings
   - Use fallback text-based launching

3. **Element Not Found**:
   - Use `waitForAnyElement()` for multiple selectors
   - Increase timeout values for slow-loading apps
   - Check for dynamic content loading

4. **Test Stability**:
   - Always use `waitForFullLoad()` after navigation
   - Implement retry logic with `clickWithRetry()`
   - Use proper expect assertions

## Performance Considerations

### Agent Efficiency Tips
- **Reuse page objects** within test methods
- **Use parallel operations** where possible
- **Cache frequently accessed data**
- **Minimize unnecessary screenshots**
- **Use appropriate timeout values**

### Example Optimized Test
```typescript
test('optimized multi-container test', async ({ page }) => {
  const casaOS = new CasaOSPage(page);
  
  // Reuse login for multiple operations
  await casaOS.gotoLogin();
  await casaOS.login(credentials.casaos.username, credentials.casaos.password);
  await casaOS.expectDashboard();
  
  // Launch multiple containers in parallel if needed
  const scrutinyPage = await casaOS.launchContainer('scrutiny');
  const scrutiny = new ScrutinyPage(scrutinyPage);
  
  // Cache expensive operations
  const drives = await scrutiny.getAllDriveInfo();
  
  // Use cached data for multiple validations
  expect(drives.length).toBeGreaterThan(0);
  expect(drives.every(d => d.status === 'Passed')).toBeTruthy();
  
  // Export once at the end
  await scrutiny.exportDriveData('final-report.txt');
});
```

## Future Extensions

Agents should follow these patterns when extending the framework:

1. **Always extend BasePage** for new page objects
2. **Add container mappings** before creating new launchers
3. **Use TypeScript interfaces** for data structures
4. **Implement proper error handling** and logging
5. **Add export capabilities** for data extraction
6. **Write comprehensive JSDoc** comments
7. **Include validation methods** for health checks

## Quick Reference

### Essential Imports
```typescript
import { test, expect } from '@playwright/test';
import { CasaOSPage } from './pages/casaOSPageEnhanced';
import { ScrutinyPage } from './pages/scrutinyPage';
import { credentials } from './config/credentials';
```

### Common Patterns
- Authentication: `casaOS.gotoLogin()` → `casaOS.login()` → `casaOS.expectDashboard()`
- Container launch: `casaOS.launchContainer(name)` 
- Wait for app: `appPage.waitForApplication()` or similar
- Data extraction: `app.getAllData()` → `app.exportData()`
- Validation: `app.validateHealth()` or similar checks