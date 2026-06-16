import { test, expect } from '@playwright/test';

test('Check in Fevikwik', async ({ page }) => {
    // 1. Setup Auth
    await page.goto('http://localhost:3000/');
    await page.evaluate(() => {
        localStorage.setItem('englabs_authenticated', 'true');
        localStorage.setItem('englabs_user_role', 'ADMIN');
        localStorage.removeItem('englabs_last_project_id');
        localStorage.setItem('last_handover_seen', new Date().toDateString());
    });
    await page.goto('http://localhost:3000/');

    // 2. Initialize Workday if present
    try {
        const initBtn = page.getByRole('button', { name: 'Initialize Workday' });
        await expect(initBtn).toBeVisible({ timeout: 2000 });
        await initBtn.click();
    } catch (e) {
        // Ignore
    }

    // 1. Navigate to Stock Registry via the correct viewport navigation
    const isMobile = await page.evaluate(() => window.innerWidth < 768);
    const navBtn = page.getByTestId('sidebar-btn-store');
    
    if (isMobile) {
        // Mobile layout routing
        const moreNav = page.getByTestId('mobile-nav-btn-more');
        if (await moreNav.isVisible()) {
            await moreNav.click({ force: true });
            await page.getByTestId('mobile-grid-btn-store').click({ force: true });
        }
    } else {
        if (await navBtn.isVisible()) {
            await navBtn.click({ force: true });
        }
    }



    // Wait for the main UI to render
    await page.waitForTimeout(2000);

    // 4. Click 'Check In'
    await page.evaluate(() => {
        Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim().toLowerCase() === 'check in')?.click();
    });
    
    // Wait for the UI
    await expect(page.getByText('Material Check-In').first()).toBeVisible({ timeout: 15000 });

    // 4. Fill Material Name
    await page.getByPlaceholder('Type to search material...').fill('Fevikwik');
    
    // Wait for dropdown suggestion and click it
    await page.waitForTimeout(1000);
    // Click the suggestion from the list using the item code
    await page.getByRole('button', { name: /Eng-079/i }).click();

    // 5. Fill Quantity
    await page.locator('input[type="number"]').fill('100');

    // 6. Remarks and Advanced Options
    await page.getByText('+ Show Advanced Options').click();

    // 7. Fill Supplier
    await page.getByPlaceholder('Enter Supplier Name').fill('SUMEER SANITARY AND HARDWARE STORE');

    await page.getByPlaceholder('Audit details or invoice notes...').fill('FEVIKWIK 203 [20GM] - Invoice 10 dated 15-Jun-26');

    // 8. Submit
    await page.getByRole('button', { name: /\+ CHECK IN/i }).click();

    // 9. Verify Success
    await expect(page.getByText('Check-In Successful!')).toBeVisible({ timeout: 10000 });
});
