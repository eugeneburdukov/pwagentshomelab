// spec: specs/test.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { CasaOSPage } from './pages/casaOSPage';
import { credentials } from './config/credentials';

test.describe('Scrutiny Drive Information', () => {
  test('Open Scrutiny and print drive information', async ({ page }) => {
    // 1. Log in to CasaOS and wait for dashboard to load
    const casa = new CasaOSPage(page);
    await casa.gotoLogin();
    await casa.login(credentials.casaos.username, credentials.casaos.password);
    await casa.expectDashboard();
    console.log('✓ CasaOS dashboard loaded successfully');

    // 2. Find and click on the Scrutiny application container on the dashboard
    await page.locator('#app-big-bear-scrutiny > .common-card > .cards-content > .in-card > .tooltip-trigger > .has-text-centered > .is-flex > .is-relative > .b-image-wrapper').click();

    // 3. Wait for Scrutiny to load in a new tab
    const scrutinyPage = await page.context().waitForEvent('page');
    await scrutinyPage.waitForLoadState('networkidle');
    await expect(scrutinyPage).toHaveURL(/192\.168\.1\.231:38080\/web\/dashboard/);
    console.log('✓ Scrutiny dashboard loaded');

    // 4. For each drive listed, extract and print information
    const driveCards = scrutinyPage.locator('a[href^="/web/device/"]');
    const driveCount = await driveCards.count();
    expect(driveCount).toBeGreaterThan(0);
    console.log(`\n--- Scrutiny Drive Report (${driveCount} drives) ---\n`);

    for (let i = 0; i < driveCount; i++) {
      const driveLink = driveCards.nth(i);
      const driveName = await driveLink.textContent();

      // Navigate to the parent card to extract status, temperature, capacity, powered on
      const card = driveLink.locator('xpath=ancestor::*[4]');

      const status = await card.locator('text=Status').locator('xpath=following-sibling::*[1]').textContent();
      const temperature = await card.locator('text=Temperature').locator('xpath=following-sibling::*[1]').textContent();
      const capacity = await card.locator('text=Capacity').locator('xpath=following-sibling::*[1]').textContent();
      const poweredOn = await card.locator('text=Powered On').locator('xpath=following-sibling::*[1]').textContent();

      const nameUpper = (driveName ?? '').trim().toUpperCase();
      console.log(nameUpper);
      console.log(`STATUS ${status?.trim()}, TEMPERATURE ${temperature?.trim()}, CAPACITY ${capacity?.trim()}, POWERED ON ${poweredOn?.trim()}`);
      console.log('');
    }

    console.log('--- End of Drive Report ---');
  });
});
