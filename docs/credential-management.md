# Credential Management Guide

## Overview

This project uses a centralized credential management system to securely handle authentication for all test services. This approach eliminates hardcoded credentials and provides flexible configuration options.

## Architecture

### Files Structure
```
tests/
├── config/
│   └── credentials.ts          # Centralized credential management
├── pages/                      # Updated to use dynamic credentials
├── *.spec.ts                  # All test files use credentials module
└── .env.example               # Template for environment variables
```

### Supported Services
- **CasaOS**: Server authentication and dashboard access
- **Jellyfin**: Media server authentication via CasaOS  
- **JellyStat**: Statistics and monitoring dashboard

## Configuration Methods

### Method 1: Environment Variables (Recommended)
Create a `.env` file in the project root:
```bash
cp .env.example .env
```

Edit `.env` with your actual credentials:
```bash
CASAOS_SERVER_URL=http://192.168.1.231
CASAOS_USERNAME=your_username
CASAOS_PASSWORD=your_password
JELLYFIN_USERNAME=your_jellyfin_user
JELLYSTAT_USERNAME=your_jellystat_user
JELLYSTAT_PASSWORD=your_jellystat_password
```

### Method 2: Default Fallback
If no environment variables are set, the system uses secure defaults suitable for development environments.

## Usage in Tests

### Import the Credentials Module
```typescript
import { credentials } from './config/credentials';
```

### Use Dynamic Credentials
```typescript
// Instead of hardcoded values
await casa.login('eugeneb', 'drandulet');

// Use dynamic credentials
await casa.login(credentials.casaos.username, credentials.casaos.password);
```

### Access Individual Services
```typescript
// CasaOS access
const casaosConfig = credentials.casaos;
await page.goto(casaosConfig.serverUrl);
await casa.login(casaosConfig.username, casaosConfig.password);

// Jellyfin access  
await jellyfinPage.fill('input[type="text"]', credentials.jellyfin.username);

// JellyStat access
await jellstatPage.login(credentials.jellystat.username, credentials.jellystat.password);
```

## Security Best Practices

### Development Environment
1. **Never commit `.env` files** - Add `.env` to `.gitignore`
2. **Use unique passwords** for each service
3. **Rotate credentials regularly** especially in shared environments

### CI/CD Environment  
1. **Set environment variables** in your CI/CD system
2. **Use secrets management** for sensitive values
3. **Limit credential scope** to minimum required permissions

### Production Environment
1. **Use secure secret storage** (Azure Key Vault, AWS Secrets Manager, etc.)
2. **Implement credential rotation** policies
3. **Monitor credential usage** and access logs

## Validation

The credential system includes validation to ensure all required credentials are available:

```typescript
import { validateCredentials } from './config/credentials';

// Run validation before tests
validateCredentials(); // Throws error if credentials missing
```

## Migration from Hardcoded Values

This refactoring replaced hardcoded credentials in:
- ✅ `tests/auth-success.spec.ts`
- ✅ `tests/dashboard-jellyfin.spec.ts` 
- ✅ `tests/open-jellystat.spec.ts`
- ✅ `tests/seed.spec.ts`
- ✅ `tests/pages/casaOSPage.ts`
- ✅ `tests/pages/collectionsPage.ts`

## Benefits

### Security
- **No hardcoded secrets** in source code
- **Environment-specific** credential management
- **Audit trail** through configuration changes

### Maintainability  
- **Single source of truth** for all credentials
- **Easy credential updates** without code changes
- **Consistent authentication** patterns across tests

### Flexibility
- **Multiple environments** (dev, staging, prod) support
- **Team member** specific credentials
- **Dynamic configuration** based on runtime conditions

## Troubleshooting

### Common Issues

**Missing Credentials Error:**
```
Error: CasaOS credentials are required
```
**Solution:** Ensure `.env` file exists with required variables or set environment variables.

**Authentication Failures:**
**Solution:** Verify credentials are correct in your `.env` file or environment variables.

**Import Errors:**
```
Cannot find module './config/credentials'
```
**Solution:** Run tests from the correct directory and ensure the credentials.ts file exists.

### Debugging

Enable credential logging (development only):
```typescript
console.log('Using credentials:', {
  casaosUser: credentials.casaos.username,
  jellyfinUser: credentials.jellyfin.username
  // Never log passwords!
});
```