import { test, expect } from '@playwright/test';
import { getTestCredentials } from './config/credentials';

test.describe('CasaOS Storage Information Display', () => {
  test('Storage Information Extraction and Display', async ({ page }) => {
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
    
    console.log('✓ Dashboard loaded successfully');
    
    // Navigate to settings page to access detailed storage information
    await page.locator('.casa.casa-settings-outline').click();
    console.log('✓ Navigated to settings page');
    
    // Wait for settings page to load
    await page.waitForTimeout(3000);
    
    // Extract storage information from the settings page
    const storageDevices = await page.evaluate(() => {
      const devices = [];
      const bodyText = document.body.innerText;
      const lines = bodyText.split('\n');
      
      // Look for storage device patterns in the text
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Pattern to match storage devices with available and total space
        // Matches: nvme0n1p1, sda1, sdb1, etc. with Available and Total information
        const storagePattern = /(nvme\d+n\d+p\d+|sd[a-z]\d+|md\d+|loop\d+|dm-\d+)\s*.*?Available[:\s]*(\d+(?:\.\d+)?)\s*(GB|TB|MB).*?Total[:\s]*(\d+(?:\.\d+)?)\s*(GB|TB|MB)/i;
        
        const match = trimmedLine.match(storagePattern);
        if (match) {
          const deviceName = match[1];
          const availableSpace = parseFloat(match[2]);
          const availableUnit = match[3].toUpperCase();
          const totalSpace = parseFloat(match[4]);
          const totalUnit = match[5].toUpperCase();
          
          devices.push({
            name: deviceName,
            available: availableSpace,
            availableUnit: availableUnit,
            total: totalSpace,
            totalUnit: totalUnit
          });
        }
      }
      
      // Alternative approach: look for separate Available and Total lines for the same device
      const deviceMap = new Map();
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Look for device names first
        const deviceMatch = trimmedLine.match(/^(nvme\d+n\d+p\d+|sd[a-z]\d+|md\d+|loop\d+|dm-\d+)$/);
        if (deviceMatch) {
          const deviceName = deviceMatch[1];
          if (!deviceMap.has(deviceName)) {
            deviceMap.set(deviceName, { name: deviceName });
          }
        }
        
        // Look for Available information
        const availableMatch = trimmedLine.match(/Available[:\s]*(\d+(?:\.\d+)?)\s*(GB|TB|MB)/i);
        if (availableMatch) {
          const availableSpace = parseFloat(availableMatch[1]);
          const availableUnit = availableMatch[2].toUpperCase();
          
          // Find the most recent device name
          const deviceNames = Array.from(deviceMap.keys());
          if (deviceNames.length > 0) {
            const lastDevice = deviceNames[deviceNames.length - 1];
            const device = deviceMap.get(lastDevice);
            device.available = availableSpace;
            device.availableUnit = availableUnit;
          }
        }
        
        // Look for Total information
        const totalMatch = trimmedLine.match(/Total[:\s]*(\d+(?:\.\d+)?)\s*(GB|TB|MB)/i);
        if (totalMatch) {
          const totalSpace = parseFloat(totalMatch[1]);
          const totalUnit = totalMatch[2].toUpperCase();
          
          // Find the most recent device name
          const deviceNames = Array.from(deviceMap.keys());
          if (deviceNames.length > 0) {
            const lastDevice = deviceNames[deviceNames.length - 1];
            const device = deviceMap.get(lastDevice);
            device.total = totalSpace;
            device.totalUnit = totalUnit;
          }
        }
      }
      
      // Add devices from the map that have complete information
      for (const device of deviceMap.values()) {
        if (device.available !== undefined && device.total !== undefined) {
          const existsInDevices = devices.some(d => d.name === device.name);
          if (!existsInDevices) {
            devices.push(device);
          }
        }
      }
      
      return devices;
    });
    
    // Display storage information in the requested format
    if (storageDevices.length > 0) {
      console.log('\n🗄️  STORAGE INFORMATION:\n');
      
      for (const device of storageDevices) {
        const deviceName = device.name;
        const available = device.available.toFixed(2);
        const availableUnit = device.availableUnit;
        const total = device.total.toFixed(2);
        const totalUnit = device.totalUnit;
        
        console.log(`${deviceName} | Available: ${available} ${availableUnit} (Total: ${total} ${totalUnit})`);
      }
      
      console.log(`\n✓ Found ${storageDevices.length} storage device(s)`);
      
    } else {
      console.log('❌ No storage information found in settings page');
      
      // Debug: Try to find storage-related text
      const debugInfo = await page.evaluate(() => {
        const bodyText = document.body.innerText;
        const storageKeywords = ['Available', 'Total', 'GB', 'TB', 'nvme', 'sda', 'sdb', 'storage'];
        const foundKeywords = [];
        
        for (const keyword of storageKeywords) {
          if (bodyText.toLowerCase().includes(keyword.toLowerCase())) {
            foundKeywords.push(keyword);
          }
        }
        
        return {
          foundKeywords,
          sampleText: bodyText.substring(0, 500)
        };
      });
      
      console.log('Debug - Found keywords:', debugInfo.foundKeywords);
      console.log('Debug - Sample text:', debugInfo.sampleText);
    }
    
    // Take a screenshot for documentation
    await page.screenshot({ 
      path: 'outputs/storage-settings-live.png', 
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved to outputs/storage-settings-live.png');
    
    // Verify we're still on the correct server
    await expect(page.url()).toContain('192.168.1.231');
    
    console.log('\n🎉 Storage information extraction completed');
  });
});