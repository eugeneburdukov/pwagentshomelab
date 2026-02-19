/**
 * Centralized Credential Management
 * 
 * This module provides secure credential management for test automation.
 * Credentials can be loaded from environment variables or fallback to defaults.
 * 
 * Environment Variables (recommended for CI/CD):
 * - CASAOS_USERNAME, CASAOS_PASSWORD
 * - JELLYFIN_USERNAME, JELLYFIN_PASSWORD  
 * - JELLYSTAT_USERNAME, JELLYSTAT_PASSWORD
 * - CASAOS_SERVER_URL
 */

export interface ServiceCredentials {
  username: string;
  password: string;
}

export interface TestConfig {
  casaos: ServiceCredentials & {
    serverUrl: string;
  };
  jellyfin: ServiceCredentials;
  jellystat: ServiceCredentials;
}

/**
 * Load credentials from environment variables with secure fallbacks
 */
export const getTestCredentials = (): TestConfig => {
  return {
    casaos: {
      username: process.env.CASAOS_USERNAME || 'eugeneb',
      password: process.env.CASAOS_PASSWORD || 'drandulet', 
      serverUrl: process.env.CASAOS_SERVER_URL || 'http://192.168.1.231'
    },
    jellyfin: {
      username: process.env.JELLYFIN_USERNAME || 'kitka',
      password: process.env.JELLYFIN_PASSWORD || '' // Jellyfin uses passwordless auth
    },
    jellystat: {
      username: process.env.JELLYSTAT_USERNAME || 'eugeneb', 
      password: process.env.JELLYSTAT_PASSWORD || 'drandulet'
    }
  };
};

/**
 * Convenience getters for individual services
 */
export const credentials = {
  get casaos() {
    return getTestCredentials().casaos;
  },
  
  get jellyfin() {
    return getTestCredentials().jellyfin;
  },
  
  get jellystat() {
    return getTestCredentials().jellystat;
  }
};

/**
 * Validate that all required credentials are available
 */
export const validateCredentials = (): void => {
  const config = getTestCredentials();
  
  if (!config.casaos.username || !config.casaos.password) {
    throw new Error('CasaOS credentials are required');
  }
  
  if (!config.jellyfin.username) {
    throw new Error('Jellyfin username is required');
  }
  
  if (!config.jellystat.username || !config.jellystat.password) {
    throw new Error('JellyStat credentials are required');
  }
  
  console.log('✓ All required credentials are available');
};