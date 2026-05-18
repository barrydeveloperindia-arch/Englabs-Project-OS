import { test, expect } from '@playwright/test';

test.describe('Englabs Projects OS - Core Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    try {
      const initBtn = page.getByRole('button', { name: 'Initialize Workday' });
      await expect(initBtn).toBeVisible({ timeout: 2000 });
      await initBtn.click();
    } catch (e) {
      // Button not present or already clicked, ignore
    }
  });

  test('Dashboard loads and shows core projects', async ({ page }) => {
    await expect(page).toHaveTitle(/ENGLABS PROJECTS OS/);
    await expect(page.getByText('Mission Control', { exact: false })).toBeVisible({ timeout: 15000 });
    
    // Check for some project cards
    const projects = page.locator('div:has-text("C0")');
    const count = await projects.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Gate Register workflow', async ({ page, isMobile }) => {
    // Navigate to Gate Register
    const navBtn = isMobile 
      ? page.getByTestId('mobile-nav-btn-logistics') 
      : page.getByTestId('sidebar-btn-logistics-command');
    await expect(navBtn).toBeVisible({ timeout: 15000 });
    await navBtn.click({ force: true });
    
    await expect(page.getByText('Recent Movements')).toBeVisible({ timeout: 15000 });

    // Open New Mission Form (On mobile it is in the footer or in the modal sheet; on desktop it is in the sidebar footer)
    const newMissionBtn = isMobile 
      ? page.getByTestId('mobile-grid-btn-zero-audit') // zero audit triggers the QA/Gate system
      : page.getByTestId('btn-new-mission');
    
    if (!isMobile) {
      await expect(newMissionBtn).toBeVisible({ timeout: 15000 });
      await newMissionBtn.click({ force: true });
      await expect(page.getByText('Initialize Mission')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('input[placeholder="e.g. C001"]')).toBeVisible({ timeout: 15000 });
    }
  });

  test('Inventory visibility', async ({ page, isMobile }) => {
    const navBtn = isMobile 
      ? page.getByTestId('mobile-nav-btn-inventory') 
      : page.getByTestId('sidebar-btn-inventory-master');
    await expect(navBtn).toBeVisible({ timeout: 15000 });
    await navBtn.click({ force: true });
    
    await expect(page.getByText('Inventory Command')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('h3:has-text("Recent Operations")')).toBeVisible({ timeout: 15000 });
  });

  test('Porter Service workflow', async ({ page, isMobile }) => {
    const navBtn = isMobile 
      ? page.getByTestId('mobile-nav-btn-porter') 
      : page.getByTestId('sidebar-btn-porter-service');
    await expect(navBtn).toBeVisible({ timeout: 15000 });
    await navBtn.click({ force: true });
    
    await expect(page.getByText('Porter Service Management')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('PROTECTION ACTIVE')).toBeVisible({ timeout: 15000 });

    // Open New Trip Form
    await page.getByRole('button', { name: /NEW TRIP/i }).click({ force: true });
    await expect(page.getByText('Porter Intake')).toBeVisible({ timeout: 15000 });
    
    // Verify Form Fields
    await expect(page.locator('input[placeholder="Enter Porter Name"]')).toBeVisible({ timeout: 15000 });
  });
});
