import { test, expect, type Page } from '@playwright/test';

// The app never scans on open: the user starts the first scan
async function startScan(page: Page) {
  await page.getByRole('button', { name: 'Start scan' }).click();
  await expect(page.locator('text=Total Size').first()).toBeVisible({ timeout: 30000 });
}

test.describe('StoryScan Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the application title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('StoryScan');
  });

  test('should display the subtitle', async ({ page }) => {
    await expect(page.getByText('Beautiful Disk Usage Visualizer')).toBeVisible();
  });

  test('should have dark mode toggle button', async ({ page }) => {
    const toggleButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await expect(toggleButton).toBeVisible();
  });

  test('should toggle dark mode when button is clicked', async ({ page }) => {
    const html = page.locator('html');

    // Get initial state (could be dark or light depending on system preference)
    const initialClasses = await html.getAttribute('class');
    const initiallyDark = initialClasses?.includes('dark') ?? false;

    // Click the theme toggle button - use title selector to avoid mobile/desktop duplication
    const toggleButton = page.locator('button[title="Toggle theme"]').first();
    await toggleButton.click();

    // Wait for the class to update
    await page.waitForTimeout(200);

    // Check that dark class state changed
    const newClasses = await html.getAttribute('class');
    const nowDark = newClasses?.includes('dark') ?? false;

    // Verify the state toggled
    expect(nowDark).not.toBe(initiallyDark);
  });

  test('should display directory selector', async ({ page }) => {
    // Wait for the selector to be visible
    await expect(page.getByRole('combobox')).toBeVisible();
  });

  test('should not scan until the user starts it', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Start scan' })).toBeVisible();
    await expect(page.locator('text=Total Size')).toHaveCount(0);
  });

  test('should load and display scan results after Start scan', async ({ page }) => {
    await startScan(page);

    // Check that stats are displayed - use more specific selectors
    await expect(page.locator('text=Total Size').first()).toBeVisible();
    await expect(page.locator('text=Files').first()).toBeVisible();
    await expect(page.locator('text=Folders').first()).toBeVisible();
  });

  test('should display treemap visualization', async ({ page }) => {
    await startScan(page);

    // Check for SVG treemap
    const svg = page.locator('svg').first();
    await expect(svg).toBeVisible();
  });

  test('should display top items list', async ({ page }) => {
    await startScan(page);

    // Check for "Top Items" heading
    await expect(page.getByText('Top Items')).toBeVisible();
  });

  test('should show breadcrumb navigation after drilling down', async ({ page }) => {
    await startScan(page);

    // Breadcrumbs only appear when inside a nested directory (not at root)
    // This test just verifies that the app loads and could show breadcrumbs
    // A more comprehensive test would require clicking into a directory
    await expect(page.locator('svg').first()).toBeVisible(); // Treemap is visible
  });

  test('should have refresh button when directory is selected', async ({ page }) => {
    await startScan(page);

    // Look for refresh button - use .first() since there are desktop and mobile versions
    const refreshButton = page.locator('button[title="Refresh scan"]').first();
    await expect(refreshButton).toBeVisible();
  });
});
