import { test, expect } from '@playwright/test';

test('checkout fevikwik 100', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(4000); 
    
    // Go to checkout
    await page.click('text=Check Out');
    await page.waitForTimeout(1000);
    
    // Type Fevikwik
    await page.fill('input[placeholder="Search by code or name..."]', 'Fevikwik');
    await page.waitForTimeout(1000);
    
    // Select Fevikwik
    await page.click('text=Fevikwik');
    await page.waitForTimeout(1000);
    
    // Set quantity
    await page.fill('input[type="number"]', '100');
    
    // Staff Name
    await page.fill('input[placeholder="Name of person taking material..."]', 'System Fix');
    
    // Remarks
    await page.fill('input[placeholder="Any additional details..."]', 'Fix duplicate balance');
    
    // Submit
    await page.click('button:has-text("Check Out")');
    await page.waitForTimeout(3000);
    
    // Now go to live register and delete the checkout transaction
    await page.click('text=Live Register');
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
