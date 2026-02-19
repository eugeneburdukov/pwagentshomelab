import { Page, expect } from '@playwright/test';
import { credentials } from '../config/credentials';

export class CasaOSPage {
  readonly page: Page;

  readonly usernameInput = 'input[name="username"], input[type="text"]';
  readonly passwordInput = 'input[name="password"], input[type="password"]';
  readonly signInButton = 'button:has-text("Sign in"), button:has-text("Login"), button:has-text("Log in")';
  readonly searchInput = 'input[placeholder="Search..."], input[placeholder="Search"]';

  constructor(page: Page) {
    this.page = page;
  }

  async gotoLogin(base = credentials.casaos.serverUrl) {
    await this.page.goto(base);
    await expect(this.page).toHaveURL(/192\.168\.1\.231/);
  }

  async login(username: string, password: string) {
    await this.page.fill(this.usernameInput, username);
    await this.page.fill(this.passwordInput, password);
    await Promise.all([
      this.page.waitForNavigation(),
      this.page.click(this.signInButton),
    ]);
  }

  async expectDashboard() {
    await expect(this.page.locator(this.searchInput)).toBeVisible({ timeout: 8000 });
    await expect(this.page).toHaveURL(/#\/$/);
  }

  async goToJellyfinContainer() {
    const jelly = this.page.locator('//div[@id="app-jellyfin"]');
    await jelly.scrollIntoViewIfNeeded();
    const [popup] = await Promise.all([
      this.page.context().waitForEvent('page'),
      jelly.click(),
    ]);
    await popup.waitForLoadState('domcontentloaded');
    return popup;
  }
}
