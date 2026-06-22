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

  test('1. Viewport Scaling & Main Bottom Tab Transitions', async ({ page, isMobile }) => {
    await expect(page).toHaveTitle(/(ENGLABS PROJECTS OS|ENGLABS PORTER SERVICE|Englabs India Pvt. Ltd)/);

    if (isMobile) {
      // Verify sidebar is completely hidden
      await expect(page.locator('aside')).toBeHidden();

      // Sequential tab transitions verifying headers and touch targets
      const tabs = [
        { testid: 'mobile-nav-btn-projects', expected: 'Project Master' },
        { testid: 'mobile-nav-btn-hr', expected: 'HR Operations Center' }
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
      await expect(page.getByText('Project Master', { exact: false })).toBeVisible({ timeout: 15000 });
    }
  });

  test('2. Projects Workspace, Filtering, & Metadata Hydration', async ({ page, isMobile }) => {
    if (isMobile) {
      // Go to Projects Tab
      await page.getByTestId('mobile-nav-btn-projects').click({ force: true });
      await expect(page.getByText('Project Master')).toBeVisible({ timeout: 15000 });

      // Check standard mock project card hydration
      const projectCard = page.locator('div:has-text("C2")').first();
      await expect(projectCard).toBeVisible({ timeout: 15000 });
    }
  });

  test('3. Interactive Stage Toggles on Projects Tab', async ({ page, isMobile }) => {
    if (isMobile) {
      // Go to Projects Tab
      await page.getByTestId('mobile-nav-btn-projects').click({ force: true });
      
      // Click a project card to go to Mission Control
      const projectCard = page.locator('div:has-text("C2")').first();
      await expect(projectCard).toBeVisible({ timeout: 15000 });
      await projectCard.click({ force: true });

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

  test.skip('4. Logistics Command (Gate Register) Movements & Intake Forms', async ({ page, isMobile }) => {
    const navBtn = isMobile 
      ? page.getByTestId('mobile-nav-btn-logistics') 
      : page.getByTestId('sidebar-btn-logistics-command');
    
    await expect(navBtn).toBeVisible({ timeout: 15000 });
    await navBtn.click({ force: true });

    // Verify dynamic Gate Register movements log is populated
    await expect(page.getByText('Recent Movements')).toBeVisible({ timeout: 15000 });
    
    if (!isMobile) {
      await expect(page.getByText('Entry ID')).toBeVisible({ timeout: 15000 });
    }
    
    await expect(page.getByText('Material', { exact: true })).toBeVisible({ timeout: 15000 });
    
    if (isMobile) {
      await validateNoHorizontalOverflow(page);
    }
  });

  test.skip('5. Dynamic Inward Logistics Log Creation & State Preservation', async ({ page, isMobile }) => {
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
    if (isMobile) {
      await page.getByTestId('mobile-nav-btn-more').click({ force: true });
      await page.getByTestId('mobile-grid-btn-store').click({ force: true });
    } else {
      await page.getByTestId('sidebar-btn-store').click({ force: true });
    }

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
    if (isMobile) {
      await page.getByTestId('mobile-nav-btn-more').click({ force: true });
      await page.getByTestId('mobile-grid-btn-reports').click({ force: true });
    } else {
      await page.getByTestId('sidebar-btn-reports').click({ force: true });
    }

    // Verify Stock Registry is active
    await expect(page.getByText('Store Stock Registry', { exact: false })).toBeVisible({ timeout: 15000 });

    // Navigate to Stock view
    const stockViewBtn = isMobile 
      ? page.locator('header').getByRole('button', { name: 'Stock', exact: true })
      : page.locator('aside').getByRole('button', { name: 'Current Stock', exact: true }).filter({ visible: true });
    await stockViewBtn.click({ force: true });
    
    // Wait for the inventory registry to load
    await expect(page.getByText('No stock items in catalog.')).not.toBeVisible({ timeout: 30000 });

    // Locate the first record's edit button
    const editButton = page.locator('button[title="Adjust stock level"]').filter({ visible: true }).first();
    await expect(editButton).toBeVisible({ timeout: 15000 });
    await editButton.click({ force: true });

    // Modal should prompt to alter records
    await expect(page.getByText('Edit Material:', { exact: false })).toBeVisible({ timeout: 15000 });
    const stockInput = page.locator('#stock-adjust-input');
    await expect(stockInput).toBeVisible({ timeout: 15000 });

    // Perform audit modification
    await stockInput.fill('25');
    await page.getByRole('button', { name: 'Apply Correction' }).click({ force: true });

    // Confirm modal closes
    await expect(page.getByText('Edit Material:', { exact: false })).not.toBeVisible({ timeout: 15000 });
  });

  test('7.5. Record Transit (Check-Out) Flow with Searchable Combobox', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.getByTestId('mobile-nav-btn-more').click({ force: true });
      await page.getByTestId('mobile-grid-btn-reports').click({ force: true });
    } else {
      await page.getByTestId('sidebar-btn-reports').click({ force: true });
    }

    // Navigate to Stock view first to ensure catalog is loaded from Firestore
    const stockViewBtn = isMobile 
      ? page.locator('header').getByRole('button', { name: 'Stock', exact: true })
      : page.locator('aside').getByRole('button', { name: 'Current Stock', exact: true }).filter({ visible: true });
    await stockViewBtn.click({ force: true });
    await expect(page.getByText('No stock items in catalog.')).not.toBeVisible({ timeout: 30000 });

    // Navigate to Check Out view
    const checkOutViewBtn = isMobile 
      ? page.locator('header').getByRole('button', { name: 'Check Out', exact: true })
      : page.locator('aside').getByRole('button', { name: 'Check Out', exact: true }).filter({ visible: true });
    await checkOutViewBtn.click({ force: true });

    // Verify view header is visible (use .first() to prevent strict mode violations with header and card h2)
    const checkOutForm = page.locator('div.max-w-xl:has-text("Material Check-Out")');
    await expect(checkOutForm.getByText('Material Check-Out', { exact: false }).first()).toBeVisible({ timeout: 15000 });

    // Find the searchable combobox input
    const comboboxInput = checkOutForm.locator('input[placeholder="Type to search material..."]');
    await expect(comboboxInput).toBeVisible({ timeout: 15000 });
    await comboboxInput.click();
    await comboboxInput.fill('a');

    // Find the first suggestion button dynamically (immune to inventory depletion)
    const firstSuggestion = checkOutForm.locator('div.relative:has(> input[placeholder="Type to search material..."]) div.absolute button').first();
    await expect(firstSuggestion).toBeVisible({ timeout: 15000 });
    
    // Get the name of the suggestion to assert value
    const itemName = await firstSuggestion.locator('span.text-slate-900').textContent();
    await firstSuggestion.click();

    // The input should now have the item name filled
    if (itemName) {
      await expect(comboboxInput).toHaveValue(itemName.trim());
    }

    // Enter checkout quantity
    const quantityInput = checkOutForm.locator('input[type="number"]').first();
    await expect(quantityInput).toBeVisible({ timeout: 15000 });
    await quantityInput.fill('2');

    // Select operator/staff/project/issuer
    await checkOutForm.getByText('+ Show Advanced Options').click();
    const selects = checkOutForm.locator('select');
    await selects.nth(0).selectOption({ index: 1 });
    await selects.nth(1).selectOption({ index: 1 });
    await selects.nth(2).selectOption({ index: 1 });
    await selects.nth(3).selectOption({ index: 1 });

    // Submit check-out
    const confirmBtn = checkOutForm.getByRole('button', { name: 'Issue Material' });
    await expect(confirmBtn).toBeVisible({ timeout: 15000 });
    await confirmBtn.click({ force: true });

    // Verify material check-out success message
    await expect(page.getByText('Material Issued!')).toBeVisible({ timeout: 15000 });
  });

  test('8. Porter Logistics Dispatch & Mobile Intake validation', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.getByTestId('mobile-nav-btn-more').click({ force: true });
      await page.getByTestId('mobile-grid-btn-porter').click({ force: true });
    } else {
      await page.getByTestId('sidebar-btn-porter-service').click({ force: true });
    }

    // Verify Porter panel loads
    await expect(page.getByText('Porter Service Management')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('PROTECTED')).toBeVisible({ timeout: 15000 });

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
      await expect(page.getByTestId('mobile-grid-btn-food')).toBeVisible({ timeout: 15000 });
      await expect(page.getByTestId('mobile-grid-btn-accounts')).toBeVisible({ timeout: 15000 });

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

      // Transition to Food
      const pantryBtn = page.getByTestId('mobile-grid-btn-food');
      await pantryBtn.click({ force: true });

      // Verify Pantry module loaded
      await expect(page.getByText('Food & Expense Tracker')).toBeVisible({ timeout: 15000 });
    }
  });
});
