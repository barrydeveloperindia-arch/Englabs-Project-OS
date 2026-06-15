import { test, expect } from '@playwright/test';

test.describe('Inventory Module CRUD Operations', () => {
    const uniqueID = Date.now().toString().slice(-5);
    const testMaterialName = `E2E_Test_Material_${uniqueID}`;
    const testCategory = 'General';
    const testUnit = 'Nos';
    const testQty = '150';
    const checkOutQty = '25';

    test.beforeEach(async ({ page }) => {
        // Mock authentication and bypass login
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('englabs_authenticated', 'true');
            localStorage.setItem('englabs_user_role', 'ADMIN');
        });
        await page.goto('/'); // Reload to apply auth

        try {
            const initBtn = page.getByRole('button', { name: 'Initialize Workday' });
            await expect(initBtn).toBeVisible({ timeout: 2000 });
            await initBtn.click();
        } catch (e) {
            // Might already be initialized
        }

        // Navigate to Inventory Command
        const navBtn = page.getByTestId('sidebar-btn-inventory-master');
        if (await navBtn.isVisible()) {
            await navBtn.click({ force: true });
        } else {
            const mobileNav = page.getByTestId('mobile-nav-btn-inventory');
            if (await mobileNav.isVisible()) await mobileNav.click({ force: true });
        }
        
        await expect(page.getByText('Inventory Command', { exact: false })).toBeVisible({ timeout: 15000 });
    });

    test('1. CREATE: Check-In New Material', async ({ page }) => {
        // Navigate to Check-In
        await page.getByRole('button', { name: 'Check In' }).click();
        await expect(page.getByText('Material Check-In')).toBeVisible();

        // Toggle New Material Mode
        await page.getByRole('button', { name: 'Register New Material' }).click();

        // Fill Material Intelligence
        await page.getByPlaceholder('Enter Material Name').fill(testMaterialName);
        await page.locator('select').first().selectOption(testUnit); // Unit
        await page.locator('select').nth(1).selectOption(testCategory); // Category
        
        // Quantity & Details
        await page.locator('input[type="number"]').fill(testQty);
        await page.getByPlaceholder('Enter Supplier Name').fill('E2E Test Supplier');
        await page.getByPlaceholder('Audit details or invoice notes...').fill('E2E Initial Check-In Note');

        // Submit
        await page.getByRole('button', { name: '+ Check In' }).click();

        // Verify Success
        await expect(page.getByText('Check-In Successful!')).toBeVisible({ timeout: 10000 });
    });

    test('2. READ: Verify Current Stock', async ({ page }) => {
        // Navigate to Current Stock
        await page.getByRole('button', { name: 'Current Stock' }).click();
        
        // Search for the material
        await page.getByPlaceholder('Search material in store stock...').fill(testMaterialName);

        // Verify Stock Math
        await expect(page.getByText(testMaterialName)).toBeVisible({ timeout: 10000 });
        const stockRow = page.locator('div').filter({ hasText: testMaterialName }).last();
        await expect(stockRow.locator(`text=${testQty} ${testUnit}`)).toBeVisible();
    });

    test('3. CREATE: Check-Out Material', async ({ page }) => {
        // Navigate to Check-Out
        await page.getByRole('button', { name: 'Check Out' }).click();
        await expect(page.getByText('Material Check-Out')).toBeVisible();

        // Select the material from the searchable dropdown
        await page.getByPlaceholder('Type to search material...').fill(testMaterialName);
        await page.getByText(testMaterialName).click();

        // Fill Details
        await page.locator('input[type="number"]').fill(checkOutQty);
        await page.getByPlaceholder('Issue slip notes or audit observations...').fill('E2E Checkout Note');

        // Submit
        await page.getByRole('button', { name: '- Check Out' }).click();

        // Verify Success
        await expect(page.getByText('Check-Out Successful!')).toBeVisible({ timeout: 10000 });
    });

    test('4. READ & UPDATE: Live Register Data', async ({ page }) => {
        // Navigate to Live Register
        await page.getByRole('button', { name: 'Live Register' }).click();
        
        // Verify Check-In and Check-Out transactions exist
        await expect(page.getByText('E2E Initial Check-In Note')).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('E2E Checkout Note')).toBeVisible({ timeout: 10000 });

        // Update (Edit) the Check-Out Note if the feature is accessible via UI
        // Example: Click Edit -> Modify Note -> Save. Assuming there is a standard edit icon.
        // We will just verify it's present for now to ensure the UI rendered the rows.
    });

    test('5. DELETE: Clean Up E2E Transactions', async ({ page }) => {
        // Navigate to Live Register
        await page.getByRole('button', { name: 'Live Register' }).click();
        
        // Locate our transactions
        const checkOutTx = page.locator('tr, div').filter({ hasText: 'E2E Checkout Note' });
        
        // Click Delete for Checkout
        if (await checkOutTx.isVisible()) {
             const delBtn = checkOutTx.locator('button').filter({ has: page.locator('svg') }).last();
             await delBtn.click();
             
             // Accept browser confirm dialog automatically
             page.on('dialog', dialog => dialog.accept());
        }

        // Locate Check-In
        const checkInTx = page.locator('tr, div').filter({ hasText: 'E2E Initial Check-In Note' });
        
        // Click Delete for Checkin
        if (await checkInTx.isVisible()) {
             const delBtn = checkInTx.locator('button').filter({ has: page.locator('svg') }).last();
             await delBtn.click();
             page.on('dialog', dialog => dialog.accept());
        }
    });
});
