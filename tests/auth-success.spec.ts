import { test } from '@playwright/test';
import { CasaOSPage } from './pages/casaOSPage';
import { credentials } from './config/credentials';

// Basic login smoke test for the CasaOS instance running at 192.168.1.231
// Credentials provided by the user.

test('login to CasaOS dashboard', async ({ page }) => {
  const casa = new CasaOSPage(page);

  await casa.gotoLogin();
  await casa.login(credentials.casaos.username, credentials.casaos.password);
  await casa.expectDashboard();
});