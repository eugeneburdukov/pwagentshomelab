import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://192.168.1.231/#/login');
  await page.locator('input[type="text"]').click();
  await page.locator('input[type="text"]').fill('eugeneb');
  await page.locator('input[type="text"]').press('Tab');
  await page.locator('input[type="password"]').fill('drandulet');
  await page.getByRole('button', { name: 'Login' }).click();
  const page1Promise = page.waitForEvent('popup');
  await page.locator('#app-qbittorrent > .common-card > .cards-content > .in-card > .tooltip-trigger > .has-text-centered > .is-flex > .is-relative > .b-image-wrapper > img').click();
  const page1 = await page1Promise;
});