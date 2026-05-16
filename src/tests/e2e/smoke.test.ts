import { test, expect } from '@playwright/test';

test.describe('Englabs Projects OS - Core Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Dashboard loads and shows core projects', async ({ page }) => {
    await expect(page).toHaveTitle(/ENGLABS PROJECTS OS/);
    await expect(page.getByText('Mission Control', { exact: false })).toBeVisible();
    // Check for some project cards - standard projects have CXXX format
    const projects = page.locator('div:has-text("C0")');
    const count = await projects.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Gate Register workflow', async ({ page }) => {
    // Navigate to Gate Register
    await page.getByTestId('sidebar-btn-logistics-command').click();
    await expect(page.getByText('Recent Movements')).toBeVisible();

    // Open New Mission Form
    await page.getByTestId('btn-new-mission').click();
    await expect(page.getByText('Initialize Mission')).toBeVisible();

    // Verify form fields
    await expect(page.locator('input[placeholder="e.g. C001"]')).toBeVisible();
  });

  test('Inventory visibility', async ({ page }) => {
    await page.getByTestId('sidebar-btn-inventory-master').click();
    await expect(page.getByText('Inventory Command')).toBeVisible();
    // Check if table rows exist - Recent Operations list
    await expect(page.locator('h3:has-text("Recent Operations")')).toBeVisible();
  });

  test('Porter Service workflow', async ({ page }) => {
    await page.getByTestId('sidebar-btn-porter-service').click();
    await expect(page.getByText('Porter Service Management')).toBeVisible();
    
    // Check for protection status
    await expect(page.getByText('PROTECTION ACTIVE')).toBeVisible();

    // Open New Trip Form
    await page.getByRole('button', { name: /NEW TRIP/i }).click();
    await expect(page.getByText('Porter Intake')).toBeVisible();
    
    // Verify Form Fields
    await expect(page.locator('input[placeholder="Enter Porter Name"]')).toBeVisible();
  });
});
