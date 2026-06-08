import { test, expect, Page } from '@playwright/test';

// Viewport Validation Helper to catch horizontal layout regressions (content clipping or scrolling sideways)
async function validateNoHorizontalOverflow(page: Page) {
  const isOverflowing = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth || document.body.scrollWidth > window.innerWidth;
  });
  expect(isOverflowing, 'Page should not have horizontal overflow on mobile viewport').toBe(false);
}

test.describe('Englabs Projects OS - Exhaustive Mobile UI & Data Integration Suite', () => {
  
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));
    // Navigate to local dashboard baseline
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('englabs_authenticated', 'true');
      localStorage.setItem('englabs_user_role', 'ADMIN');
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

  test('1. Viewport Scaling & Main Bottom Tab Transitions', async ({ page, isMobile }) => {
    await expect(page).toHaveTitle(/ENGLABS PROJECTS OS/);

    if (isMobile) {
      // Verify sidebar is completely hidden
      await expect(page.locator('aside')).toBeHidden();

      // Sequential tab transitions verifying headers and touch targets
      const tabs = [
        { testid: 'mobile-nav-btn-projects', expected: 'Mission Control' },
        { testid: 'mobile-nav-btn-logistics', expected: 'Recent Movements' },
        { testid: 'mobile-nav-btn-inventory', expected: 'Inventory Command' },
        { testid: 'mobile-nav-btn-report', expected: 'Store Stock Registry' },
        { testid: 'mobile-nav-btn-porter', expected: 'Porter Service Management' }
      ];

      for (const tab of tabs) {
        const tabBtn = page.getByTestId(tab.testid);
        await expect(tabBtn).toBeVisible({ timeout: 15000 });
        await tabBtn.click({ force: true });
        await expect(page.getByText(tab.expected, { exact: false })).toBeVisible({ timeout: 15000 });
        await validateNoHorizontalOverflow(page);
      }
    } else {
      // Desktop verification fallback
      await expect(page.getByText('Mission Control', { exact: false })).toBeVisible({ timeout: 15000 });
    }
  });

  test('2. Projects Workspace, Filtering, & Metadata Hydration', async ({ page, isMobile }) => {
    if (isMobile) {
      // Go to Projects Tab
      await page.getByTestId('mobile-nav-btn-projects').click({ force: true });
      await expect(page.getByText('Mission Control')).toBeVisible({ timeout: 15000 });

      // Check standard mock project card hydration
      const projectCard = page.locator('div:has-text("C0")').first();
      await expect(projectCard).toBeVisible({ timeout: 15000 });
    }
  });

  test('3. Interactive Stage Toggles on Projects Tab', async ({ page, isMobile }) => {
    if (isMobile) {
      // Go to Projects Tab
      await page.getByTestId('mobile-nav-btn-projects').click({ force: true });
      await expect(page.getByText('Production Pipeline')).toBeVisible({ timeout: 15000 });

      // Click the first stage card (Engineering Design) which toggles its completion status
      const stageCard = page.getByText('Engineering Design').first();
      await expect(stageCard).toBeVisible({ timeout: 15000 });
      await stageCard.click({ force: true });

      // Wait a moment for dynamic state update to re-render
      await page.waitForTimeout(500);
      
      // Click again to cycle state back
      await stageCard.click({ force: true });
    }
  });

  test('4. Logistics Command (Gate Register) Movements & Intake Forms', async ({ page, isMobile }) => {
    const navBtn = isMobile 
      ? page.getByTestId('mobile-nav-btn-logistics') 
      : page.getByTestId('sidebar-btn-logistics-command');
    
    await expect(navBtn).toBeVisible({ timeout: 15000 });
    await navBtn.click({ force: true });

    // Verify dynamic Gate Register movements log is populated
    await expect(page.getByText('Recent Movements')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Entry ID')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Material', { exact: true })).toBeVisible({ timeout: 15000 });
    
    if (isMobile) {
      await validateNoHorizontalOverflow(page);
    }
  });

  test('5. Dynamic Inward Logistics Log Creation & State Preservation', async ({ page, isMobile }) => {
    const navBtn = isMobile 
      ? page.getByTestId('mobile-nav-btn-logistics') 
      : page.getByTestId('sidebar-btn-logistics-command');
    
    await expect(navBtn).toBeVisible({ timeout: 15000 });
    await navBtn.click({ force: true });

    // Trigger New Log entry form
    await page.getByRole('button', { name: /NEW LOG ENTRY/i }).click({ force: true });
    await expect(page.getByText('Log Movement')).toBeVisible({ timeout: 15000 });

    // Fill in required vendor information
    await page.locator('input[placeholder="Vendor Name"]').fill('Ridhan');
    await page.locator('input[placeholder="MH-01-..."]').fill('PB-65-AX-9921');
    await page.locator('input[placeholder="INV-000000"]').fill('REF-887766');

    // Fill in item description and quantity to pass validation
    await page.locator('input[placeholder="Enter Item Description..."]').fill('Steel Beams');
    await page.locator('input[type="number"]').first().fill('50');

    // Fill in Accountability section
    await page.locator('input[placeholder="Name"]').fill('Gaurav Panchal');

    // Execute submission
    await page.getByRole('button', { name: /Execute Inward Registry/i }).click({ force: true });

    // Verify form closes and we are back to dashboard
    await expect(page.getByText('Recent Movements')).toBeVisible({ timeout: 15000 });
  });

  test('6. Inventory Master Dashboard, Real-time Stats, & Alerts', async ({ page, isMobile }) => {
    const navBtn = isMobile 
      ? page.getByTestId('mobile-nav-btn-inventory') 
      : page.getByTestId('sidebar-btn-inventory-master');

    await expect(navBtn).toBeVisible({ timeout: 15000 });
    await navBtn.click({ force: true });

    // Verify main Inventory Command dashboard renders
    await expect(page.getByText('Inventory Command')).toBeVisible({ timeout: 15000 });

    // Verify core stats cards are populated
    await expect(page.getByText('Unique Items')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Total Stock')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Critical Low')).toBeVisible({ timeout: 15000 });

    // Verify recent operations list renders items
    await expect(page.locator('h3:has-text("Recent Operations")')).toBeVisible({ timeout: 15000 });
    
    if (isMobile) {
      await validateNoHorizontalOverflow(page);
    }
  });

  test('7. Store Stock Registry, Passcode Corrections, & Responsive Card UI', async ({ page, isMobile }) => {
    const navBtn = isMobile 
      ? page.getByTestId('mobile-nav-btn-report') 
      : page.getByTestId('sidebar-btn-store-stock-report');

    await expect(navBtn).toBeVisible({ timeout: 15000 });
    await navBtn.click({ force: true });

    // Verify Stock Registry is active
    await expect(page.getByText('Store Stock Registry', { exact: false })).toBeVisible({ timeout: 15000 });

    // Open Report
    const reportRow = page.getByText('SR-20260514-MASTER');
    await expect(reportRow).toBeVisible({ timeout: 30000 });
    await reportRow.click({ force: true });

    // Confirm WebView details header
    await expect(page.getByText('Store Report: SR-20260514-MASTER')).toBeVisible({ timeout: 15000 });

    // Locate the first record's edit button depending on desktop vs mobile cards
    const editButton = page.locator('button[title="Edit Item Stock"]').filter({ visible: true }).first();
    await expect(editButton).toBeVisible({ timeout: 15000 });
    await editButton.click({ force: true });

    // Modal should prompt to alter records
    await expect(page.getByText('Adjust Stock:', { exact: false })).toBeVisible({ timeout: 15000 });
    const stockInput = page.locator('#stock-input');
    await expect(stockInput).toBeVisible({ timeout: 15000 });

    // Perform audit modification
    await stockInput.fill('25');
    await page.getByRole('button', { name: 'Confirm Audit Changes' }).click({ force: true });

    // Confirm modal closes
    await expect(page.getByText('Adjust Stock:', { exact: false })).not.toBeVisible({ timeout: 15000 });
  });

  test('7.5. Record Transit (Check-Out) Flow with Searchable Combobox', async ({ page, isMobile }) => {
    const navBtn = isMobile 
      ? page.getByTestId('mobile-nav-btn-report') 
      : page.getByTestId('sidebar-btn-store-stock-report');

    await expect(navBtn).toBeVisible({ timeout: 15000 });
    await navBtn.click({ force: true });

    // Open Report
    const reportRow = page.getByText('SR-20260514-MASTER');
    await expect(reportRow).toBeVisible({ timeout: 30000 });
    await reportRow.click({ force: true });

    // Open Check Out Item Modal
    const checkOutBtn = page.getByRole('button', { name: 'Check Out Item' });
    await expect(checkOutBtn).toBeVisible({ timeout: 15000 });
    await checkOutBtn.click({ force: true });

    // Verify modal header is visible
    await expect(page.getByText('Manual Material Check-Out', { exact: false })).toBeVisible({ timeout: 15000 });

    // Find the searchable combobox input
    const comboboxInput = page.locator('input[placeholder="-- Type to Search Stock Item --"]');
    await expect(comboboxInput).toBeVisible({ timeout: 15000 });
    await comboboxInput.click();

    // Type query to filter
    await comboboxInput.fill('Chemilac');

    // Suggestion dropdown should be visible
    const firstSuggestion = page.getByText('Chemilac Black Paint').last();
    await expect(firstSuggestion).toBeVisible({ timeout: 15000 });
    await firstSuggestion.click();

    // The input should now have the item name filled
    await expect(comboboxInput).toHaveValue(/Chemilac/);

    // Enter checkout quantity
    const quantityInput = page.locator('input[name="quantity"]');
    await expect(quantityInput).toBeVisible({ timeout: 15000 });
    await quantityInput.fill('2');

    // Select operator/staff if needed
    const staffSelect = page.locator('select[name="partyName"]');
    if (await staffSelect.count() > 0) {
      await staffSelect.selectOption({ index: 1 });
    }

    // Submit check-out
    const confirmBtn = page.getByRole('button', { name: 'Confirm Check-Out' });
    await expect(confirmBtn).toBeVisible({ timeout: 15000 });
    await confirmBtn.click({ force: true });

    // Verify modal is closed
    await expect(page.getByText('Manual Material Check-Out', { exact: false })).not.toBeVisible({ timeout: 15000 });
  });

  test('8. Porter Logistics Dispatch & Mobile Intake validation', async ({ page, isMobile }) => {
    const navBtn = isMobile 
      ? page.getByTestId('mobile-nav-btn-porter') 
      : page.getByTestId('sidebar-btn-porter-service');

    await expect(navBtn).toBeVisible({ timeout: 15000 });
    await navBtn.click({ force: true });

    // Verify Porter panel loads
    await expect(page.getByText('Porter Service Management')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('PROTECTION ACTIVE')).toBeVisible({ timeout: 15000 });

    // Trigger New Trip Form
    await page.getByRole('button', { name: /NEW TRIP/i }).click({ force: true });
    await expect(page.getByText('Porter Intake')).toBeVisible({ timeout: 15000 });

    // Fill form and cancel/close
    const nameInput = page.locator('input[placeholder="Enter Porter Name"]');
    await expect(nameInput).toBeVisible({ timeout: 15000 });
    await nameInput.fill('Ratnesh Kumar');
    
    await page.getByTestId('btn-close-porter').click({ force: true });
    await expect(page.getByText('Porter Intake')).not.toBeVisible({ timeout: 15000 });
  });

  test('9. More Bottom Sheet Modal & Secondary Administrative Workspaces', async ({ page, isMobile }) => {
    if (isMobile) {
      // 1. Open More sheet
      const moreBtn = page.getByTestId('mobile-nav-btn-more');
      await expect(moreBtn).toBeVisible({ timeout: 15000 });
      await moreBtn.click({ force: true });

      // Verify bottom sheet overlays open
      await expect(page.getByText('More Operations')).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('Englabs Administrative Control')).toBeVisible({ timeout: 15000 });

      // Verify secondary option buttons are present
      await expect(page.getByTestId('mobile-grid-btn-pantry')).toBeVisible({ timeout: 15000 });
      await expect(page.getByTestId('mobile-grid-btn-finance')).toBeVisible({ timeout: 15000 });
      await expect(page.getByTestId('mobile-grid-btn-sky-5-kitchen')).toBeVisible({ timeout: 15000 });

      // Close sheet modal
      await page.getByTestId('btn-close-more-sheet').click({ force: true });
      await expect(page.getByText('More Operations')).not.toBeVisible({ timeout: 15000 });
    }
  });

  test('10. Pantry Control Panel Transition via More Sheet', async ({ page, isMobile }) => {
    if (isMobile) {
      // Open More sheet
      const moreBtn = page.getByTestId('mobile-nav-btn-more');
      await expect(moreBtn).toBeVisible({ timeout: 15000 });
      await moreBtn.click({ force: true });

      // Transition to Pantry
      const pantryBtn = page.getByTestId('mobile-grid-btn-pantry');
      await pantryBtn.click({ force: true });

      // Verify Pantry module loaded
      await expect(page.getByText('Food & Expense Tracker')).toBeVisible({ timeout: 15000 });
    }
  });
});
