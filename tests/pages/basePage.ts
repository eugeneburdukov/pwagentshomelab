import { Page, Locator, expect } from '@playwright/test';

/**
 * Base Page Object Model providing common functionality for all page objects.
 * 
 * Features:
 * - Consistent error handling
 * - Standardized waiting strategies
 * - Common utility methods
 * - Logging capabilities for agent debugging
 */
export class BasePage {
  readonly page: Page;
  protected readonly pageTimeout = 30000;
  protected readonly elementTimeout = 10000;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Enhanced navigation with validation and error handling
   */
  async navigateTo(url: string, expectedUrlPattern?: RegExp | string): Promise<void> {
    try {
      await this.page.goto(url);
      await this.page.waitForLoadState('networkidle', { timeout: this.pageTimeout });
      
      if (expectedUrlPattern) {
        await expect(this.page).toHaveURL(expectedUrlPattern);
      }
      
      this.log(`✓ Successfully navigated to ${url}`);
    } catch (error) {
      this.logError(`Failed to navigate to ${url}`, error);
      throw error;
    }
  }

  /**
   * Wait for element with enhanced error reporting
   */
  async waitForElement(selector: string, options: { timeout?: number, state?: 'visible' | 'hidden' | 'attached' | 'detached' } = {}): Promise<Locator> {
    const timeout = options.timeout || this.elementTimeout;
    const state = options.state || 'visible';
    
    try {
      const locator = this.page.locator(selector);
      await locator.waitFor({ state, timeout });
      this.log(`✓ Element found: ${selector}`);
      return locator;
    } catch (error) {
      this.logError(`Element not found within ${timeout}ms: ${selector}`, error);
      throw error;
    }
  }

  /**
   * Wait for any of multiple selectors to be visible (useful for dynamic UIs)
   */
  async waitForAnyElement(selectors: string[], timeout = this.elementTimeout): Promise<{ locator: Locator, selector: string }> {
    const promises = selectors.map(selector => ({
      selector,
      promise: this.page.locator(selector).waitFor({ state: 'visible', timeout })
    }));

    try {
      const results = await Promise.allSettled(promises.map(p => p.promise));
      const successIndex = results.findIndex(result => result.status === 'fulfilled');
      
      if (successIndex === -1) {
        throw new Error(`None of the selectors were found: ${selectors.join(', ')}`);
      }

      const successfulSelector = selectors[successIndex];
      const locator = this.page.locator(successfulSelector);
      this.log(`✓ Found element: ${successfulSelector}`);
      
      return { locator, selector: successfulSelector };
    } catch (error) {
      this.logError(`Failed to find any elements from: ${selectors.join(', ')}`, error);
      throw error;
    }
  }

  /**
   * Enhanced click with retry logic and validation
   */
  async clickWithRetry(selector: string, options: { maxRetries?: number, timeout?: number } = {}): Promise<void> {
    const maxRetries = options.maxRetries || 3;
    const timeout = options.timeout || this.elementTimeout;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const locator = await this.waitForElement(selector, { timeout });
        await locator.click();
        this.log(`✓ Successfully clicked: ${selector}`);
        return;
      } catch (error) {
        this.log(`Attempt ${attempt}/${maxRetries} failed for: ${selector}`);
        if (attempt === maxRetries) {
          this.logError(`All click attempts failed for: ${selector}`, error);
          throw error;
        }
        await this.page.waitForTimeout(1000); // Brief pause between retries
      }
    }
  }

  /**
   * Fill form field with validation
   */
  async fillField(selector: string, value: string, options: { clearFirst?: boolean } = {}): Promise<void> {
    try {
      const locator = await this.waitForElement(selector);
      
      if (options.clearFirst) {
        await locator.clear();
      }
      
      await locator.fill(value);
      // Verify the value was set correctly
      const actualValue = await locator.inputValue();
      expect(actualValue).toBe(value);
      
      this.log(`✓ Successfully filled field: ${selector}`);
    } catch (error) {
      this.logError(`Failed to fill field: ${selector}`, error);
      throw error;
    }
  }

  /**
   * Take screenshot with descriptive filename
   */
  async takeScreenshot(name: string, fullPage = true): Promise<string> {
    const filename = `outputs/${name}-${Date.now()}.png`;
    await this.page.screenshot({ path: filename, fullPage });
    this.log(`✓ Screenshot saved: ${filename}`);
    return filename;
  }

  /**
   * Extract text content with error handling
   */
  async getTextContent(selector: string): Promise<string> {
    try {
      const locator = await this.waitForElement(selector);
      const text = await locator.textContent();
      return text?.trim() || '';
    } catch (error) {
      this.logError(`Failed to get text content: ${selector}`, error);
      return '';
    }
  }

  /**
   * Check if element exists without throwing error
   */
  async elementExists(selector: string, timeout = 5000): Promise<boolean> {
    try {
      await this.page.locator(selector).waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Logging utilities for agent debugging
   */
  protected log(message: string): void {
    console.log(`[${this.constructor.name}] ${message}`);
  }

  protected logError(message: string, error: any): void {
    console.error(`[${this.constructor.name}] ❌ ${message}`);
    if (error instanceof Error) {
      console.error(`Details: ${error.message}`);
    }
  }

  /**
   * Wait for page to be fully loaded with all async content
   */
  async waitForFullLoad(): Promise<void> {
    await Promise.all([
      this.page.waitForLoadState('networkidle'),
      this.page.waitForLoadState('domcontentloaded')
    ]);
  }
}