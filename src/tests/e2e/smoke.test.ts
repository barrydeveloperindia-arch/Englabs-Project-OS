import { test, expect } from '@playwright/test';

test.describe('Englabs Projects OS - Core Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('englabs_authenticated', 'true');
      localStorage.setItem('englabs_user_role', 'ADMIN');
      localStorage.removeItem('englabs_last_project_id');
      localStorage.setItem('last_handover_seen', new Date().toDateString());
    });
    await page.goto('/'); // Reload to apply localStorage authentication
    try {
      const initBtn = page.getByRole('button', { name: 'Initialize Workday' });
      await expect(initBtn).toBeVisible({ timeout: 2000 });
      await initBtn.click();
    } catch (e) {
      // Button not present or already clicked, ignore
    }
  });

  test('Dashboard loads and shows core projects', async ({ page, isMobile }) => {
    await expect(page).toHaveTitle(/Englabs India Pvt. Ltd/);
    if (isMobile) {
      await expect(page.getByRole('heading', { name: 'Command Center', exact: false })).toBeVisible({ timeout: 15000 });
    } else {
      await expect(page.getByText('Project Master', { exact: false })).toBeVisible({ timeout: 15000 });
    }
    
    // Check for some project cards
    const projects = page.locator('button:has-text("C")');
    const count = await projects.count();
    expect(count).toBeGreaterThan(0);
  });

  test.skip('Gate Register workflow', async ({ page, isMobile }) => {
    // Navigate to Gate Register
    const navBtn = isMobile 
      ? page.getByTestId('mobile-nav-btn-logistics') 
      : page.getByTestId('sidebar-btn-gate-command');
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
    if (isMobile) {
      await page.getByTestId('mobile-nav-btn-more').click({ force: true });
      await page.getByTestId('mobile-grid-btn-store').click({ force: true });
    } else {
      await page.getByTestId('sidebar-btn-store').click({ force: true });
    }
    
    await expect(page.getByText('Inventory Command')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('h3:has-text("Recent Operations")')).toBeVisible({ timeout: 15000 });
  });

  test('Porter Service workflow', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.getByTestId('mobile-nav-btn-more').click({ force: true });
      await page.getByTestId('mobile-grid-btn-porter').click({ force: true });
    } else {
      await page.getByTestId('sidebar-btn-porter-service').click({ force: true });
    }
    
    await expect(page.getByText('Porter Service Management')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('PROTECTION ACTIVE')).toBeVisible({ timeout: 15000 });

    // Open New Trip Form
    await page.getByRole('button', { name: /NEW TRIP/i }).click({ force: true });
    await expect(page.getByText('Porter Intake')).toBeVisible({ timeout: 15000 });
    
    // Verify Form Fields
    await expect(page.locator('input[placeholder="Enter Porter Name"]')).toBeVisible({ timeout: 15000 });
  });
});
