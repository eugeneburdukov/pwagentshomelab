import { test, expect } from '@playwright/test';
import { CasaOSPage } from './pages/casaOSPageEnhanced';
import { ScrutinyPage } from './pages/scrutinyPage';
import { credentials } from './config/credentials';

/**
 * Enhanced Scrutiny Drive Information Test
 * 
 * Uses the enhanced page object model for robust interaction with CasaOS and Scrutiny.
 * Features improved error handling, logging, and data extraction capabilities.
 */
test.describe('Scrutiny Drive Information - Enhanced', () => {
  test('Extract and display drive information using enhanced page objects', async ({ page }) => {
    // 1. Initialize enhanced CasaOS page object
    const casaOS = new CasaOSPage(page);
    
    // 2. Authenticate with enhanced error handling
    await casaOS.gotoLogin();
    await casaOS.login(credentials.casaos.username, credentials.casaos.password);
    await casaOS.expectDashboard();

    // 3. Validate system health before proceeding
    await casaOS.validateSystemHealth();

    // 4. Launch Scrutiny container using generic launcher
    const scrutinyPageRaw = await casaOS.launchContainer('scrutiny');
    const scrutiny = new ScrutinyPage(scrutinyPageRaw);

    // 5. Wait for Scrutiny dashboard and validate
    await scrutiny.waitForDashboard();
    await scrutiny.validateScrutinyUrl();

    // 6. Extract and validate drive information
    const driveCount = await scrutiny.getDriveCount();
    expect(driveCount).toBeGreaterThan(0);

    // 7. Print drive information in requested format
    await scrutiny.printDriveInfo('standard');

    // 8. Perform additional health validations
    const isHealthy = await scrutiny.validateDriveHealth();
    expect(isHealthy).toBeTruthy();

    // 9. Check for temperature warnings
    const hotDrives = await scrutiny.checkDriveTemperatures(45, 55);
    if (hotDrives.length > 0) {
      console.log(`⚠ Found ${hotDrives.length} drives with elevated temperatures`);
    }

    // 10. Export drive data for future reference
    const exportPath = await scrutiny.exportDriveData('current-drive-status.txt');
    console.log(`✓ Drive data exported to: ${exportPath}`);

    // 11. Take diagnostic screenshot
    await scrutiny.takeScreenshot('scrutiny-dashboard-final');
  });

  test('Detailed drive information extraction', async ({ page }) => {
    const casaOS = new CasaOSPage(page);
    const scrutinyPageRaw = await casaOS.launchContainer('scrutiny');
    const scrutiny = new ScrutinyPage(scrutinyPageRaw);

    await casaOS.gotoLogin();
    await casaOS.login(credentials.casaos.username, credentials.casaos.password);
    await casaOS.expectDashboard();
    
    await scrutiny.waitForDashboard();

    // Print detailed format
    await scrutiny.printDriveInfo('detailed');

    // Get programmatic access to drive data
    const allDrives = await scrutiny.getAllDriveInfo();
    
    // Validate each drive has required information
    for (const drive of allDrives) {
      expect(drive.device).toBeTruthy();
      expect(drive.model).toBeTruthy();
      expect(drive.status).toBeTruthy();
      expect(drive.temperature).toBeTruthy();
      expect(drive.capacity).toBeTruthy();
    }

    console.log(`✓ Successfully validated ${allDrives.length} drives with complete information`);
  });

  test('Container interaction validation', async ({ page }) => {
    // Test the enhanced container launching capabilities
    const casaOS = new CasaOSPage(page);
    
    await casaOS.gotoLogin();
    await casaOS.login(credentials.casaos.username, credentials.casaos.password);
    await casaOS.expectDashboard();

    // Get list of visible applications
    const applications = await casaOS.getVisibleApplications();
    expect(applications.length).toBeGreaterThan(0);
    console.log(`✓ Found ${applications.length} applications on dashboard`);

    // Test search functionality
    await casaOS.searchApplications('Scrutiny');
    await casaOS.clearSearch();

    // Launch Scrutiny using the enhanced launcher
    const scrutinyPageRaw = await casaOS.launchContainer('scrutiny');
    const scrutiny = new ScrutinyPage(scrutinyPageRaw);
    
    await scrutiny.waitForDashboard();
    
    // Verify we can extract basic information
    const driveCount = await scrutiny.getDriveCount();
    console.log(`✓ Container interaction successful - monitoring ${driveCount} drives`);
  });
});