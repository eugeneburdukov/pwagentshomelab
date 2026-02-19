import { test, expect } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';
import { CasaOSPage } from './pages/casaOSPage';
import { JellyfinPage } from './pages/jellyfinPage';
import { CollectionsPage } from './pages/collectionsPage';
import { credentials } from './config/credentials';

// After logging in, click the Jellyfin container and switch to the opened tab.

test('open Jellyfin in a new window', async ({ page }) => {
  const casa = new CasaOSPage(page);

  await casa.gotoLogin();
  await casa.login(credentials.casaos.username, credentials.casaos.password);
  await casa.expectDashboard();

  // click the Jellyfin tile and obtain the new page
  const jellyPageRaw = await casa.goToJellyfinContainer();
  const jelly = new JellyfinPage(jellyPageRaw);

  // verify login screen is loaded
  await jelly.waitForLoginScreen();
  
  // Next steps: perform username-only sign-in using provided account
  // username: kitka, password: (ignored)
  await jellyPageRaw.fill('input#txtManualName, input[type="text"], input[type="email"]', credentials.jellyfin.username);
  await jellyPageRaw.click('button:has-text("Sign in"), button:has-text("Login"), button:has-text("Log in")');

  // wait for the UI to settle and assert we've left the login screen
  await jellyPageRaw.waitForLoadState('networkidle', { timeout: 10000 });
  await jelly.expectLoggedIn();

  // assert we landed on the expected host/port
  await expect(jellyPageRaw.url()).toContain(':8097');

  // Navigate to Collections using the dedicated page object
  const collections = new CollectionsPage(jellyPageRaw);
  await collections.navigateToCollections();
  await collections.expectCollectionsPage();

  // take a screenshot of the Collections view
  await collections.takeScreenshot();
});

test('take high-quality screenshot of collections with full image loading', async ({ page }) => {
  const casa = new CasaOSPage(page);

  await casa.gotoLogin();
  await casa.login(credentials.casaos.username, credentials.casaos.password);
  await casa.expectDashboard();

  // click the Jellyfin tile and obtain the new page
  const jellyPageRaw = await casa.goToJellyfinContainer();
  const jelly = new JellyfinPage(jellyPageRaw);

  // verify login screen is loaded
  await jelly.waitForLoginScreen();
  
  // perform username-only sign-in using provided account
  await jellyPageRaw.fill('input#txtManualName, input[type="text"], input[type="email"]', credentials.jellyfin.username);
  await jellyPageRaw.click('button:has-text("Sign in"), button:has-text("Login"), button:has-text("Log in")');

  // wait for the UI to settle and assert we've left the login screen
  await jellyPageRaw.waitForLoadState('networkidle', { timeout: 10000 });
  await jelly.expectLoggedIn();

  // assert we landed on the expected host/port
  await expect(jellyPageRaw.url()).toContain(':8097');

  // Navigate to Collections using the dedicated page object
  const collections = new CollectionsPage(jellyPageRaw);
  await collections.navigateToCollections();
  await collections.expectCollectionsPage();

  // Take high-quality screenshot with comprehensive waiting
  await collections.takeHighQualityScreenshot('collections-with-images-loaded.png');
});

test('export all movie collections to file', async ({ page }) => {
  const casa = new CasaOSPage(page);

  await casa.gotoLogin();
  await casa.login(credentials.casaos.username, credentials.casaos.password);
  await casa.expectDashboard();

  // click the Jellyfin tile and obtain the new page
  const jellyPageRaw = await casa.goToJellyfinContainer();
  const jelly = new JellyfinPage(jellyPageRaw);

  // verify login screen is loaded
  await jelly.waitForLoginScreen();
  
  // perform username-only sign-in using provided account
  await jellyPageRaw.fill('input#txtManualName, input[type="text"], input[type="email"]', credentials.jellyfin.username);
  await jellyPageRaw.click('button:has-text("Sign in"), button:has-text("Login"), button:has-text("Log in")');

  // wait for the UI to settle and assert we've left the login screen
  await jellyPageRaw.waitForLoadState('networkidle', { timeout: 10000 });
  await jelly.expectLoggedIn();

  // assert we landed on the expected host/port
  await expect(jellyPageRaw.url()).toContain(':8097');

  // Navigate to Collections using the dedicated page object
  const collections = new CollectionsPage(jellyPageRaw);
  await collections.navigateToCollections();
  await collections.expectCollectionsPage();

  // Export all collections to a text file
  const exportPath = await collections.exportCollectionsToFile('movie-collections-export.txt');
  
  // Verify the file was created and contains expected content
  const fileExists = await fs.access(exportPath).then(() => true).catch(() => false);
  expect(fileExists).toBe(true);
  
  const fileContent = await fs.readFile(exportPath, 'utf8');
  expect(fileContent).toContain('JELLYFIN MOVIE COLLECTIONS');
  expect(fileContent).toContain('Total Collections:');
  expect(fileContent).toContain('Generated on:');
  
  // Verify some expected collections are in the export
  expect(fileContent).toContain('Harry Potter Collection');
  expect(fileContent).toContain('Star Wars Collection');
  expect(fileContent).toContain('The Matrix Collection');
  
  console.log('Collections export completed successfully:', exportPath);
});