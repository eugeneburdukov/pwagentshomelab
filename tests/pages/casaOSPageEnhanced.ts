import { Page, expect } from '@playwright/test';
import { BasePage } from './basePage';
import { credentials } from '../config/credentials';

/**
 * Enhanced CasaOS Page Object Model
 * 
 * Handles authentication and provides generic methods for interacting with
 * CasaOS containers. Uses the BasePage for enhanced error handling and logging.
 * 
 * Key Features:
 * - Robust authentication flow
 * - Generic container launching
 * - Dashboard validation
 * - Application discovery
 */
export class CasaOSPage extends BasePage {
  // Authentication selectors
  private readonly authSelectors = {
    username: 'input[name="username"], input[type="text"]',
    password: 'input[name="password"], input[type="password"]',
    signInButton: 'button:has-text("Sign in"), button:has-text("Login"), button:has-text("Log in")'
  };

  // Dashboard selectors
  private readonly dashboardSelectors = {
    searchInput: 'input[placeholder="Search..."], input[placeholder="Search"]',
    systemStatus: 'text=System status',
    appIcons: '.cardBox, .common-card, [data-app-id]'
  };

  // Known container mappings (can be extended as needed)
  private readonly containerMappings = {
    jellyfin: {
      names: ['jellyfin', 'jellyfin1011'],
      selector: '#app-jellyfin, [data-app="jellyfin"]',
      expectedPort: '8097'
    },
    scrutiny: {
      names: ['scrutiny'],
      selector: '#app-big-bear-scrutiny .b-image-wrapper, [data-app="scrutiny"]',
      expectedPort: '38080'
    },
    portainer: {
      names: ['portainer'],
      selector: '#app-portainer, [data-app="portainer"]',
      expectedPort: '9000'
    },
    unifi: {
      names: ['unifi'],
      selector: '#app-unifi, [data-app="unifi"]',
      expectedPort: '8443'
    }
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to CasaOS login page
   */
  async gotoLogin(serverUrl = credentials.casaos.serverUrl): Promise<void> {
    await this.navigateTo(serverUrl, /192\.168\.1\.231/);
    this.log('✓ CasaOS server is accessible');
  }

  /**
   * Perform authentication with enhanced error handling
   */
  async login(username: string, password: string): Promise<void> {
    try {
      // Check if already logged in
      if (await this.elementExists(this.dashboardSelectors.searchInput)) {
        this.log('✓ Already authenticated');
        return;
      }

      await this.fillField(this.authSelectors.username, username);
      await this.fillField(this.authSelectors.password, password, { clearFirst: true });

      // Click login and wait for navigation
      await Promise.all([
        this.page.waitForURL(/#\/$/, { timeout: this.pageTimeout }),
        this.clickWithRetry(this.authSelectors.signInButton)
      ]);

      this.log('✓ Authentication successful');
    } catch (error) {
      this.logError('Authentication failed', error);
      throw error;
    }
  }

  /**
   * Validate that dashboard is properly loaded
   */
  async expectDashboard(): Promise<void> {
    try {
      await this.waitForElement(this.dashboardSelectors.searchInput, { timeout: 15000 });
      await expect(this.page).toHaveURL(/#\/$/);
      
      // Wait for system status to ensure full dashboard load
      await this.waitForElement(this.dashboardSelectors.systemStatus);
      
      this.log('✓ Dashboard validated successfully');
    } catch (error) {
      this.logError('Dashboard validation failed', error);
      throw error;
    }
  }

  /**
   * Generic method to launch any container application
   */
  async launchContainer(containerName: string): Promise<Page> {
    const containerConfig = this.containerMappings[containerName.toLowerCase()];
    
    if (!containerConfig) {
      // Fall back to generic search if not in mappings
      return await this.launchContainerByName(containerName);
    }

    try {
      await this.clickWithRetry(containerConfig.selector);
      
      // Wait for new page to open
      const containerPage = await this.page.context().waitForEvent('page', { timeout: this.pageTimeout });
      await containerPage.waitForLoadState('networkidle');
      
      // Validate expected port if configured
      if (containerConfig.expectedPort) {
        await expect(containerPage).toHaveURL(new RegExp(containerConfig.expectedPort));
      }
      
      this.log(`✓ ${containerName} container launched successfully`);
      return containerPage;
    } catch (error) {
      this.logError(`Failed to launch ${containerName} container`, error);
      throw error;
    }
  }

  /**
   * Launch container by text search (fallback method)
   */
  private async launchContainerByName(containerName: string): Promise<Page> {
    try {
      // Search for container by visible text
      const containerLocator = this.page.locator(`text="${containerName}"`).or(
        this.page.locator(`[aria-label*="${containerName}"]`)
      ).first();

      await containerLocator.scrollIntoViewIfNeeded();
      
      // Find the clickable parent (usually a card or button)
      const clickableParent = containerLocator.locator('xpath=ancestor::*[contains(@class, "card") or contains(@class, "button") or @role="button"][1]');
      
      await clickableParent.click();
      
      const containerPage = await this.page.context().waitForEvent('page', { timeout: this.pageTimeout });
      await containerPage.waitForLoadState('networkidle');
      
      this.log(`✓ ${containerName} container launched via text search`);
      return containerPage;
    } catch (error) {
      this.logError(`Failed to launch ${containerName} container via text search`, error);
      throw error;
    }
  }

  /**
   * Specific method for Jellyfin (for backward compatibility)
   * @deprecated Use launchContainer('jellyfin') instead
   */
  async goToJellyfinContainer(): Promise<Page> {
    this.log('⚠ Using deprecated goToJellyfinContainer, consider using launchContainer("jellyfin")');
    return await this.launchContainer('jellyfin');
  }

  /**
   * Search for applications on the dashboard
   */
  async searchApplications(query: string): Promise<void> {
    await this.fillField(this.dashboardSelectors.searchInput, query);
    await this.page.waitForTimeout(1000); // Allow search to filter
    this.log(`✓ Searched for applications: ${query}`);
  }

  /**
   * Clear search and show all applications
   */
  async clearSearch(): Promise<void> {
    await this.fillField(this.dashboardSelectors.searchInput, '', { clearFirst: true });
    await this.page.waitForTimeout(1000);
    this.log('✓ Search cleared');
  }

  /**
   * Get list of visible applications on dashboard
   */
  async getVisibleApplications(): Promise<string[]> {
    try {
      const appElements = this.page.locator(this.dashboardSelectors.appIcons);
      const count = await appElements.count();
      const applications: string[] = [];

      for (let i = 0; i < count; i++) {
        const appText = await appElements.nth(i).textContent();
        if (appText?.trim()) {
          applications.push(appText.trim());
        }
      }

      this.log(`✓ Found ${applications.length} visible applications`);
      return applications;
    } catch (error) {
      this.logError('Failed to get visible applications', error);
      return [];
    }
  }

  /**
   * Validate system health indicators
   */
  async validateSystemHealth(): Promise<{ cpu: string, ram: string, storage: string }> {
    try {
      const healthData = {
        cpu: await this.getTextContent('text=CPU').then(() => 'Available'),
        ram: await this.getTextContent('text=RAM').then(() => 'Available'),
        storage: await this.getTextContent('text=Storage').then(() => 'Available')
      };

      this.log('✓ System health indicators validated');
      return healthData;
    } catch (error) {
      this.logError('Failed to validate system health', error);
      throw error;
    }
  }
}