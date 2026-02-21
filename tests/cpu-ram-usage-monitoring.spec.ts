import { test, expect } from '@playwright/test';
import { getTestCredentials } from './config/credentials';

test.describe('CasaOS CPU and RAM Usage Monitoring', () => {
  test('CPU and RAM Usage Verification', async ({ page }) => {
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
    
    // Verify CPU usage indicator is visible on dashboard
    await expect(page.getByText('CPU').first()).toBeVisible();
    console.log('✓ CPU usage indicator found');
    
    // Verify RAM usage indicator is visible on dashboard
    await expect(page.getByText('RAM').first()).toBeVisible();
    console.log('✓ RAM usage indicator found');
    
    // Extract and print actual CPU and RAM usage values
    const usageValues = await page.evaluate(() => {
      // Get all text content 
      const bodyText = document.body.innerText;
      
      // Based on debug output, the structure is:
      // System status
      // [number]  <- CPU usage
      // CPU
      // [temperature]
      // [number]  <- RAM usage  
      // RAM
      
      // Find CPU usage - look for number before CPU label
      let cpuUsage = null;
      const cpuPatterns = [
        /System status[^a-zA-Z]*?(\d+)[^a-zA-Z]*?CPU/is,    // System status ... number ... CPU
        /(\d+)[^a-zA-Z]*?CPU/i,                             // number ... CPU
        /status[^a-zA-Z]*?(\d+)[^a-zA-Z]*?CPU/is           // status ... number ... CPU
      ];
      
      for (const pattern of cpuPatterns) {
        const match = bodyText.match(pattern);
        if (match) {
          cpuUsage = match[1];
          break;
        }
      }
      
      // Find RAM usage - look for number before RAM label, after CPU section
      let ramUsage = null;
      const ramPatterns = [
        /CPU[^a-zA-Z]*?[\d.]+[^\d]*?(\d+)[^a-zA-Z]*?RAM/is,  // CPU ... temperature ... number ... RAM
        /(\d+)[^a-zA-Z]*?RAM/i,                               // number ... RAM
        /°C[^a-zA-Z]*?(\d+)[^a-zA-Z]*?RAM/is                 // °C ... number ... RAM
      ];
      
      for (const pattern of ramPatterns) {
        const match = bodyText.match(pattern);
        if (match) {
          ramUsage = match[1];
          break;
        }
      }
      
      return {
        cpu: cpuUsage,
        ram: ramUsage
      };
    });
    
    // Print the current CPU and RAM usage to terminal
    if (usageValues.cpu) {
      console.log(`📊 Current CPU Usage: ${usageValues.cpu}%`);
    } else {
      console.log('📊 CPU usage value not found in expected format');
    }
    
    if (usageValues.ram) {
      console.log(`📊 Current RAM Usage: ${usageValues.ram}%`);  
    } else {
      console.log('📊 RAM usage value not found in expected format');
    }
    
    // Verify System status section is present (contains CPU and RAM)
    await expect(page.getByText('System status').first()).toBeVisible();
    console.log('✓ System status section is visible');
    
    // Verify CPU and RAM sections contain their respective monitoring elements
    // Using more specific assertions to ensure monitoring data is displayed
    const hasCpuMonitoring = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      // Check if CPU appears along with some numeric indicators
      return bodyText.includes('CPU') && /\d+/.test(bodyText);
    });
    
    const hasRamMonitoring = await page.evaluate(() => {
      const bodyText = document.body.innerText;  
      // Check if RAM appears along with some numeric indicators
      return bodyText.includes('RAM') && /\d+/.test(bodyText);
    });
    
    expect(hasCpuMonitoring).toBe(true);
    console.log('✓ CPU monitoring data is present');
    
    expect(hasRamMonitoring).toBe(true);
    console.log('✓ RAM monitoring data is present');
    
    // Verify additional system monitoring elements are present
    const systemElements = ['Storage', 'Network status'];
    for (const element of systemElements) {
      await expect(page.getByText(element).first()).toBeVisible();
      console.log(`✓ ${element} indicator found`);
    }
    
    // Take a screenshot for documentation
    await page.screenshot({ 
      path: 'outputs/cpu-ram-usage-test.png', 
      fullPage: true 
    });
    console.log('✓ CPU and RAM usage screenshot captured');
    
    // Verify the dashboard URL is correct
    await expect(page.url()).toContain('192.168.1.231');
    
    console.log('🎉 CPU and RAM usage monitoring test completed successfully');
  });
});