import { Page, expect } from '@playwright/test';

/**
 * Page object for the Jellyfin web UI that is hosted inside CasaOS.
 * Provides helpers for working with the login screen and later interactions.
 */
export class JellyfinPage {
  readonly page: Page;

  // common locators
  readonly loginNameInput = 'input#txtManualName, input[type="text"], input[type="email"]';
  readonly passwordInput = 'input[type="password"]';
  readonly signInButton = 'button:has-text("Sign in"), button:has-text("Login"), button:has-text("Log in")';

  constructor(page: Page) {
    this.page = page;
  }

  async waitForLoginScreen() {
    await expect(this.page.locator(this.loginNameInput)).toBeVisible({ timeout: 10000 });
    await expect(this.page.locator(this.passwordInput)).toBeVisible();
  }

  async login(username: string, password: string) {
    await this.page.fill(this.loginNameInput, username);
    await this.page.fill(this.passwordInput, password);
    await Promise.all([
      this.page.waitForNavigation(),
      this.page.click(this.signInButton),
    ]);
  }

  async expectLoggedIn() {
    // after login the URL usually changes and some UI shows up
    await expect(this.page).not.toHaveURL(/login/i);
  }
}
