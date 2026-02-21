import { test, expect } from '@playwright/test';
import { getTestCredentials } from './config/credentials';

test.describe('CasaOS Dashboard Login and Verification', () => {
  test('CasaOS Dashboard Verification', async ({ page }) => {
    const credentials = getTestCredentials();
    
    // Navigate to CasaOS server homepage
    await page.goto(credentials.casaos.serverUrl);
    
    // Verify page title is CasaOS
    await expect(page).toHaveTitle('CasaOS');
    
    // Check if login is needed by waiting briefly and checking for login elements
    try {
      // Wait for either login form or dashboard to appear
      await page.waitForSelector('input[type="text"], [data-testid="system-status"], :text("System status")', { timeout: 5000 });
      
      const isLoginFormVisible = await page.locator('input[type="text"]').isVisible();
      
      if (isLoginFormVisible) {
        console.log('Login required - authenticating...');
        
        // Fill in username
        await page.locator('input[type="text"]').fill(credentials.casaos.username);
        
        // Fill in password  
        await page.locator('input[type="password"]').fill(credentials.casaos.password);
        
        // Click login button
        await page.getByRole('button', { name: 'Login' }).click();
        
        // Wait for dashboard to load by waiting for System status to appear
        await expect(page.getByText('System status').first()).toBeVisible({ timeout: 15000 });
        console.log('Login successful - dashboard loaded');
      } else {
        console.log('Already authenticated - verifying dashboard is loaded');
        // Even if no login required, wait for dashboard elements to be ready
        await expect(page.getByText('System status').first()).toBeVisible({ timeout: 15000 });
      }
    } catch (error) {
      console.log('Error during login detection/authentication:', error);
      throw error;
    }
    
    // Verify that system status indicator is visible on dashboard
    await expect(page.getByText('System status').first()).toBeVisible({ timeout: 5000 });
    
    // Verify CPU usage indicator is visible on dashboard
    await expect(page.getByText('CPU').first()).toBeVisible();
    
    // Verify RAM usage indicator is visible on dashboard
    await expect(page.getByText('RAM').first()).toBeVisible();
    
    // Verify storage status is visible on dashboard
    await expect(page.getByText('Storage').first()).toBeVisible();
    
    // Verify network status indicator is visible on dashboard
    await expect(page.getByText('Network status').first()).toBeVisible();
    
    // Verify the dashboard URL is correct
    await expect(page.url()).toContain('192.168.1.231');
  });
});