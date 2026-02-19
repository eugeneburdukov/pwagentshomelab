import { test, expect } from '@playwright/test';
import { CasaOSPage } from './pages/casaOSPage';
import { credentials } from './config/credentials';

test.describe('CasaOS Application Access', () => {
  test('open JellyStat after CasaOS login', async ({ page }) => {
    console.log('🚀 Starting JellyStat access test...');
    
    const casa = new CasaOSPage(page);
    
    // Navigate to CasaOS and perform login
    await casa.gotoLogin();
    console.log('✓ CasaOS server is accessible');
    
    await casa.login(credentials.casaos.username, credentials.casaos.password);
    console.log('✓ CasaOS authentication successful');
    
    await casa.expectDashboard();
    console.log('✓ CasaOS dashboard loaded successfully');
    
    // Look for Jellystat application and click it to open in new tab
    const jellstatContainer = page.locator('//div[@id="app-big-bear-jellystat"]');
    await jellstatContainer.scrollIntoViewIfNeeded();
    await expect(jellstatContainer).toBeVisible();
    console.log('✓ Jellystat application found in dashboard');
    
    // Click on Jellystat container to open it in new tab
    const [jellstatPage] = await Promise.all([
      page.context().waitForEvent('page'),
      jellstatContainer.click()
    ]);
    
    console.log('✓ Jellystat opened in new tab');
    
    // Verify JellyStat interface loads successfully
    await expect(jellstatPage.getByRole('button', { name: 'Login' })).toBeVisible();
    console.log('✓ JellyStat login screen loaded');
    
    // Verify correct URL and page title
    await expect(jellstatPage).toHaveURL('http://192.168.1.231:3000/');
    await expect(jellstatPage).toHaveTitle('JellyStat');
    console.log('✓ JellyStat accessible on expected port 3000');
    
    // Take screenshot for verification
    await jellstatPage.screenshot({ path: 'outputs/jellystat-login-screen.png' });
    console.log('✓ JellyStat login screen screenshot captured');
    
    // Perform JellyStat authentication
    await jellstatPage.fill('input[type="text"], input:not([type="password"])', credentials.jellystat.username);
    await jellstatPage.fill('input[type="password"]', credentials.jellystat.password);
    console.log('✓ JellyStat credentials entered');
    
    await jellstatPage.getByRole('button', { name: 'Login' }).click();
    console.log('✓ JellyStat login button clicked');
    
    // Wait for login to complete and verify successful authentication
    await expect(jellstatPage.locator(':has-text("MOVIE LIBRARIES")').first()).toBeVisible({ timeout: 10000 });
    console.log('✓ JellyStat authentication successful');
    
    // Take screenshot of JellyStat dashboard
    await jellstatPage.screenshot({ path: 'outputs/jellystat-dashboard.png' });
    console.log('✓ JellyStat dashboard screenshot captured');
    
    console.log('🎉 JellyStat access test completed successfully!');
  });
});