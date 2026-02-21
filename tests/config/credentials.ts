/**
 * Centralized Credential Management
 * 
 * This module provides secure credential management for test automation.
 * Credentials are loaded exclusively from environment variables or .env file.
 * 
 * Environment Variables (recommended for CI/CD):
 * - CASAOS_USERNAME, CASAOS_PASSWORD
 * - JELLYFIN_USERNAME, JELLYFIN_PASSWORD  
 * - JELLYSTAT_USERNAME, JELLYSTAT_PASSWORD
 * - CASAOS_SERVER_URL
 */

import * as fs from 'fs';
import * as path from 'path';

// Load .env file manually if it exists
function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    }
  }
}

// Load .env file on module import
loadEnvFile();

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
 * Load credentials from environment variables
 * Throws an error if required environment variables are not set
 */
export const getTestCredentials = (): TestConfig => {
  const requiredEnvVars = {
    CASAOS_USERNAME: process.env.CASAOS_USERNAME,
    CASAOS_PASSWORD: process.env.CASAOS_PASSWORD,
    CASAOS_SERVER_URL: process.env.CASAOS_SERVER_URL,
    JELLYFIN_USERNAME: process.env.JELLYFIN_USERNAME,
    JELLYSTAT_USERNAME: process.env.JELLYSTAT_USERNAME,
    JELLYSTAT_PASSWORD: process.env.JELLYSTAT_PASSWORD
  };

  // Check for missing required environment variables
  const missingVars = Object.entries(requiredEnvVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please create a .env file with these variables or set them in your environment.\n' +
      'See .env.example for the required format.'
    );
  }

  return {
    casaos: {
      username: process.env.CASAOS_USERNAME!,
      password: process.env.CASAOS_PASSWORD!, 
      serverUrl: process.env.CASAOS_SERVER_URL!
    },
    jellyfin: {
      username: process.env.JELLYFIN_USERNAME!,
      password: process.env.JELLYFIN_PASSWORD || '' // Jellyfin may use passwordless auth
    },
    jellystat: {
      username: process.env.JELLYSTAT_USERNAME!, 
      password: process.env.JELLYSTAT_PASSWORD!
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