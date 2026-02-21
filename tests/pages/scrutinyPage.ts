import { Page, expect, Locator } from '@playwright/test';
import { BasePage } from './basePage';

/**
 * Drive information interface for type safety
 */
export interface DriveInfo {
  device: string;
  interface: string;
  model: string;
  status: string;
  temperature: string;
  capacity: string;
  poweredOn: string;
  lastUpdated: string;
  deviceUrl: string;
}

/**
 * ScrutinyPage Object Model
 * 
 * Handles interactions with the Scrutiny hard drive monitoring dashboard.
 * Provides methods to extract drive information, navigate to device details,
 * and validate drive health status.
 * 
 * Key Features:
 * - Drive information extraction
 * - Health status validation
 * - Temperature monitoring
 * - Device detail navigation
 * - Export capabilities
 */
export class ScrutinyPage extends BasePage {
  private readonly scrutinySelectors = {
    dashboardTitle: 'h2:has-text("Dashboard")',
    driveCards: 'div:has(a[href^="/web/device/"])',
    driveLinks: 'a[href^="/web/device/"]',
    statusIndicators: 'div:has-text("Status")',
    temperatureIndicators: 'div:has-text("Temperature")',
    capacityIndicators: 'div:has-text("Capacity")',
    poweredOnIndicators: 'div:has-text("Powered On")',
    exportButton: 'button:has-text("Export")',
    settingsButton: 'button:has-text("Settings")',
    archivedButton: 'button:has-text("Archived")'
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Wait for Scrutiny dashboard to load completely
   */
  async waitForDashboard(): Promise<void> {
    try {
      await this.waitForElement(this.scrutinySelectors.dashboardTitle);
      await this.waitForElement(this.scrutinySelectors.driveLinks);
      await this.waitForFullLoad();
      this.log('✓ Scrutiny dashboard loaded successfully');
    } catch (error) {
      this.logError('Failed to load Scrutiny dashboard', error);
      throw error;
    }
  }

  /**
   * Validate that Scrutiny is running on the expected URL
   */
  async validateScrutinyUrl(expectedPort = '38080'): Promise<void> {
    const urlPattern = new RegExp(`192\\.168\\.1\\.231:${expectedPort}\\/web\\/dashboard`);
    await expect(this.page).toHaveURL(urlPattern);
    this.log(`✓ Scrutiny running on expected port ${expectedPort}`);
  }

  /**
   * Get count of monitored drives
   */
  async getDriveCount(): Promise<number> {
    const driveLinks = this.page.locator(this.scrutinySelectors.driveLinks);
    const count = await driveLinks.count();
    expect(count).toBeGreaterThan(0);
    this.log(`✓ Found ${count} drives being monitored`);
    return count;
  }

  /**
   * Extract information for all drives
   */
  async getAllDriveInfo(): Promise<DriveInfo[]> {
    await this.waitForDashboard();
    const driveCount = await this.getDriveCount();
    const drives: DriveInfo[] = [];

    this.log(`Extracting information for ${driveCount} drives...`);

    for (let i = 0; i < driveCount; i++) {
      try {
        const driveInfo = await this.extractDriveInfo(i);
        drives.push(driveInfo);
        this.log(`✓ Extracted info for drive ${i + 1}: ${driveInfo.device}`);
      } catch (error) {
        this.logError(`Failed to extract info for drive ${i + 1}`, error);
        // Continue with other drives
      }
    }

    return drives;
  }

  /**
   * Extract information for a specific drive by index
   */
  private async extractDriveInfo(driveIndex: number): Promise<DriveInfo> {
    const driveLinks = this.page.locator(this.scrutinySelectors.driveLinks);
    const driveLink = driveLinks.nth(driveIndex);
    
    // Get the drive name and URL
    const driveNameText = await driveLink.textContent();
    const deviceUrl = await driveLink.getAttribute('href');
    
    if (!driveNameText || !deviceUrl) {
      throw new Error(`Failed to get basic info for drive ${driveIndex}`);
    }

    // Parse drive name (format: "/dev/sdc - sat - CT2000MX500SSD1")
    const nameMatches = driveNameText.trim().match(/^(.+?)\s*-\s*(.+?)\s*-\s*(.+)$/);
    if (!nameMatches) {
      throw new Error(`Unexpected drive name format: ${driveNameText}`);
    }

    const [, device, interfaceType, model] = nameMatches;

    // Get the parent card container to extract other details
    const cardContainer = driveLink.locator('xpath=ancestor::*[4]'); // Navigate up to the card container

    // Extract status, temperature, capacity, and powered on info
    const status = await this.extractCardDetail(cardContainer, 'Status');
    const temperature = await this.extractCardDetail(cardContainer, 'Temperature');
    const capacity = await this.extractCardDetail(cardContainer, 'Capacity');
    const poweredOn = await this.extractCardDetail(cardContainer, 'Powered On');

    // Extract last updated info
    const lastUpdatedElement = cardContainer.locator('text=/Last Updated on/');
    const lastUpdated = await lastUpdatedElement.textContent() || 'Unknown';

    return {
      device: device.trim(),
      interface: interfaceType.trim(),
      model: model.trim(),
      status: status.trim(),
      temperature: temperature.trim(),
      capacity: capacity.trim(),
      poweredOn: poweredOn.trim(),
      lastUpdated: lastUpdated.replace('Last Updated on ', '').trim(),
      deviceUrl: deviceUrl
    };
  }

  /**
   * Extract detail from drive card (Status, Temperature, etc.)
   */
  private async extractCardDetail(cardContainer: Locator, detailType: string): Promise<string> {
    try {
      // Look for the detail label and get its sibling value
      const detailLabel = cardContainer.locator(`text=${detailType}`);
      const detailValue = detailLabel.locator('xpath=following-sibling::*[1]');
      const value = await detailValue.textContent();
      return value?.trim() || 'Unknown';
    } catch (error) {
      this.log(`⚠ Could not extract ${detailType} info`);
      return 'Unknown';
    }
  }

  /**
   * Print drive information in the specified format
   */
  async printDriveInfo(format: 'standard' | 'detailed' = 'standard'): Promise<void> {
    const drives = await this.getAllDriveInfo();
    
    console.log(`\n--- Scrutiny Drive Report (${drives.length} drives) ---\n`);

    for (const drive of drives) {
      if (format === 'standard') {
        // Format: /DEV/SDC - SAT - CT2000MX500SSD1
        console.log(`${drive.device.toUpperCase()} - ${drive.interface.toUpperCase()} - ${drive.model}`);
        console.log(`STATUS ${drive.status}, TEMPERATURE ${drive.temperature}, CAPACITY ${drive.capacity}, POWERED ON ${drive.poweredOn}`);
        console.log('');
      } else {
        // Detailed format with all information
        console.log(`Device: ${drive.device}`);
        console.log(`Interface: ${drive.interface}`);
        console.log(`Model: ${drive.model}`);
        console.log(`Status: ${drive.status}`);
        console.log(`Temperature: ${drive.temperature}`);
        console.log(`Capacity: ${drive.capacity}`);
        console.log(`Powered On: ${drive.poweredOn}`);
        console.log(`Last Updated: ${drive.lastUpdated}`);
        console.log(`Detail URL: ${drive.deviceUrl}`);
        console.log('---');
      }
    }

    console.log('--- End of Drive Report ---\n');
  }

  /**
   * Navigate to detailed view of a specific drive
   */
  async navigateToDriveDetail(driveDevice: string): Promise<void> {
    const drives = await this.getAllDriveInfo();
    const targetDrive = drives.find(drive => 
      drive.device.toLowerCase().includes(driveDevice.toLowerCase())
    );

    if (!targetDrive) {
      throw new Error(`Drive ${driveDevice} not found`);
    }

    await this.page.click(`a[href="${targetDrive.deviceUrl}"]`);
    await this.waitForFullLoad();
    this.log(`✓ Navigated to detail view for ${targetDrive.device}`);
  }

  /**
   * Export drive data to file
   */
  async exportDriveData(filename?: string): Promise<string> {
    const drives = await this.getAllDriveInfo();
    const exportData = drives.map(drive => 
      `${drive.device.toUpperCase()} - ${drive.interface.toUpperCase()} - ${drive.model}\n` +
      `STATUS ${drive.status}, TEMPERATURE ${drive.temperature}, CAPACITY ${drive.capacity}, POWERED ON ${drive.poweredOn}\n`
    ).join('\n');

    const outputFilename = filename || `scrutiny-drives-${Date.now()}.txt`;
    const outputPath = `outputs/${outputFilename}`;

    // Write to file using Node.js filesystem
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const fullPath = path.join(process.cwd(), outputPath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, exportData, 'utf8');

    this.log(`✓ Drive data exported to ${outputPath}`);
    return outputPath;
  }

  /**
   * Validate all drives are healthy
   */
  async validateDriveHealth(): Promise<boolean> {
    const drives = await this.getAllDriveInfo();
    const unhealthyDrives = drives.filter(drive => 
      !drive.status.toLowerCase().includes('passed') && 
      !drive.status.toLowerCase().includes('healthy')
    );

    if (unhealthyDrives.length > 0) {
      this.logError(`Found ${unhealthyDrives.length} unhealthy drives:`, 
        unhealthyDrives.map(d => `${d.device}: ${d.status}`));
      return false;
    }

    this.log(`✓ All ${drives.length} drives are healthy`);
    return true;
  }

  /**
   * Check for drives with high temperature
   */
  async checkDriveTemperatures(warningThreshold = 50, criticalThreshold = 60): Promise<DriveInfo[]> {
    const drives = await this.getAllDriveInfo();
    const hotDrives: DriveInfo[] = [];

    for (const drive of drives) {
      const tempMatch = drive.temperature.match(/(\d+)°?C?/);
      if (tempMatch) {
        const temp = parseInt(tempMatch[1]);
        if (temp >= criticalThreshold) {
          this.logError(`CRITICAL: ${drive.device} temperature is ${drive.temperature}`);
          hotDrives.push(drive);
        } else if (temp >= warningThreshold) {
          this.log(`⚠ WARNING: ${drive.device} temperature is ${drive.temperature}`);
          hotDrives.push(drive);
        }
      }
    }

    return hotDrives;
  }
}