# CasaOS Home Lab Test Automation

A comprehensive Playwright test automation suite for CasaOS home laboratory environment, featuring integrated testing of CasaOS, Jellyfin media server, and JellyStat analytics dashboard.

## 🏠 Project Overview

This project provides end-to-end test automation for a home lab setup running:
- **CasaOS**: Personal cloud operating system
- **Jellyfin**: Open-source media server
- **JellyStat**: Jellyfin statistics and analytics dashboard

## 📂 Project Structure

A modular Playwright architecture designed for automated dashboard interactions and media server management.

```text
pwagentshomelab/
├── tests/
│   ├── config/
│   │   └── credentials.ts          # Centralized credential management
│   ├── pages/                      # Page Object Model (POM) layer
│   │   ├── casaOSPage.ts           # CasaOS dashboard interactions
│   │   ├── jellyfinPage.ts         # Jellyfin media server
│   │   └── collectionsPage.ts      # Jellyfin collections management
│   ├── auth-success.spec.ts        # Basic authentication tests
│   ├── dashboard-jellyfin.spec.ts  # Jellyfin integration tests
│   ├── open-jellystat.spec.ts      # JellyStat dashboard tests
│   └── seed.spec.ts                # Environment validation suite
├── outputs/                        # Generated screenshots and test artifacts
├── docs/                           # Technical documentation
├── specs/                          # Test plans and functional specs
├── playwright.config.ts            # Playwright engine configuration
└── .env.example                    # Template for secrets (CasaOS/Jellyfin creds)

### Key Features
- ✅ **Complete CasaOS Integration**: Authentication, dashboard navigation, application launching
- ✅ **Jellyfin Media Testing**: Collections browsing, content validation, screenshot capture
- ✅ **JellyStat Analytics**: Dashboard access, statistics verification
- ✅ **Secure Credential Management**: Environment-based configuration with fallbacks
- ✅ **Page Object Architecture**: Maintainable, reusable test components
- ✅ **Comprehensive Reporting**: Screenshots, data exports, environment validation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- CasaOS server running on your network
- Jellyfin and JellyStat applications installed in CasaOS

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd pwagentshomelab

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

= = = = =
1. Update VSCode to latest version 1.105 +
2. Playwright needs to be updated 1.56.0 + 
npm install -D @playwright/test@latest
3. You can also follow docs at: https://playwright.dev/docs/test-agents
4. Install playwright or updated to the latest
npm init playwright@latest
5. Install agents with: npx playwright init-agents --loop=vscode
6. Under .GitHub - chatmodes - all installed agents located
7. Under .vscode - mcp.json generated config for MCP agent run instructions
= = = = =


Useful Commands

# Run all tests
npm test

# Run all tests with Playwright
npx playwright test

# Run tests with interactive UI mode
npx playwright test --ui

# Run specific test file
npx playwright test tests/seed.spec.ts

# Run specific test by name
npx playwright test --grep "open JellyStat"

# Run tests in headed browser (visible)
npx playwright test --headed

# Run tests with debug mode
npx playwright test --debug

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

Test Development & Debugging

# Record new tests interactively
npx playwright codegen http://192.168.1.231

# Generate code for specific browser
npx playwright codegen --browser=chromium http://192.168.1.231

# Run tests with trace recording
npx playwright test --trace=on

# Run tests and retry failed tests
npx playwright test --retries=3

# Run specific test configuration
npx playwright test --config=playwright.config.ts

# Update Playwright browsers
npx playwright install

# Check Playwright version
npx playwright --version

Reporting & Analysis

# Generate and open HTML report
npx playwright show-report

# Generate report without opening
npx playwright test --reporter=html

# Generate JSON report
npx playwright test --reporter=json

# Generate multiple report formats
npx playwright test --reporter=html,json,junit

# Run tests with verbose output
npx playwright test --reporter=list

# Show trace viewer
npx playwright show-trace test-results/trace.zip

Advanced Options

# Run tests in parallel with specific workers
npx playwright test --workers=4

# Run tests with custom timeout
npx playwright test --timeout=60000

# Run tests matching pattern
npx playwright test tests/dashboard-*.spec.ts

# Run tests with custom global timeout
npx playwright test --global-timeout=300000

# Run tests and update snapshots
npx playwright test --update-snapshots

# Run tests with specific tags
npx playwright test --grep @smoke

# Skip tests with specific pattern
npx playwright test --grep-invert @slow

Quick Test Shortcuts

# Run seed tests only (environment validation)
npm run test:seed
# or
npx playwright test tests/seed.spec.ts

# Run JellyStat tests only
npm run test:jellystat  
# or
npx playwright test tests/open-jellystat.spec.ts

# Run Jellyfin tests only  
npm run test:jellyfin
# or
npx playwright test tests/dashboard-jellyfin.spec.ts

# Run authentication tests only
npm run test:auth
# or 
npx playwright test tests/auth-success.spec.ts
