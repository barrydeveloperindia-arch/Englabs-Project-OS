import { test, expect } from '@playwright/test';

test('checkout fevikwik 100', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.evaluate(() => {
        localStorage.setItem('englabs_authenticated', 'true');
        localStorage.setItem('englabs_user_role', 'STAFF');
        localStorage.removeItem('englabs_last_project_id');
        localStorage.setItem('last_handover_seen', new Date().toDateString());
    });
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(4000); 
    
    // Go to checkout using robust navigation helper
    const isMobile = await page.evaluate(() => window.innerWidth < 768);
    const checkOutViewBtn = isMobile 
      ? page.locator('header').getByRole('button', { name: 'Check Out', exact: true })
      : page.locator('aside').getByRole('button', { name: 'Check Out', exact: true }).filter({ visible: true });
    await expect(checkOutViewBtn).toBeVisible({ timeout: 15000 });
    await checkOutViewBtn.click({ force: true });
    await page.waitForTimeout(1000);
    
    // Type Fevikwik
    await page.getByPlaceholder('Type to search material...').fill('Fevikwik');
    await page.waitForTimeout(1000);
    
    // Select Fevikwik suggestion
    await page.getByRole('button', { name: /Eng-079/i }).click();
    await page.waitForTimeout(1000);
    
    // Set quantity
    await page.locator('input[type="number"]').first().fill('100');
    
    // Select staff name (select dropdown)
    await page.locator('select').first().selectOption({ index: 1 });
    
    // Show advanced options for Remarks
    await page.getByText('+ Show Advanced Options').click();
    await page.waitForTimeout(500);
    
    // Fill Remarks
    await page.getByPlaceholder('Issue slip notes or audit observations...').fill('Fix duplicate balance');
    
    // Submit
    await page.click('button:has-text("Issue Material")');
    await page.waitForTimeout(3000);
    
    // Now go to live register using robust navigation helper
    const liveRegisterBtn = isMobile 
      ? page.locator('header').getByRole('button', { name: 'Live Register', exact: true })
      : page.locator('aside').getByRole('button', { name: 'Live Register', exact: true }).filter({ visible: true });
    await expect(liveRegisterBtn).toBeVisible({ timeout: 15000 });
    await liveRegisterBtn.click({ force: true });
    await page.waitForTimeout(2000);
    
    // Use the evaluate to delete the transaction from firebase directly
    const result = await page.evaluate(async () => {
        const db = (window as any).db;
        const collection = (window as any).collection;
        const getDocs = (window as any).getDocs;
        const deleteDoc = (window as any).deleteDoc;
        const doc = (window as any).doc;
        
        const mrRef = collection(db, "master_register");
        const mrSnap = await getDocs(mrRef);
        let toDelete = null;
        mrSnap.forEach((d: any) => {
            const data = d.data();
            if (data.itemCode === "Eng-079" && data.type === "OUTWARD" && data.quantity === 100 && data.remarks === "Fix duplicate balance") {
                toDelete = d.id;
            }
        });
        
        if (toDelete) {
            await deleteDoc(doc(db, "master_register", toDelete));
            return "Deleted dummy checkout transaction " + toDelete;
        }
        return "Not found dummy checkout";
    });
    
    console.log(result);
});
