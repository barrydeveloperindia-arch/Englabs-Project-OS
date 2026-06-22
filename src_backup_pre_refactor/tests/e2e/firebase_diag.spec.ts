import { test, expect } from '@playwright/test';

test('check current stock fevikwik', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(4000); 
    
    const result = await page.evaluate(async () => {
        const db = (window as any).db;
        const getDoc = (window as any).getDoc;
        const doc = (window as any).doc;
        
        let output = "";
        
        if (db && getDoc && doc) {
            output += "--- FEVIKWIK CURRENT STOCK ---\n";
            const stockRef = doc(db, "current_stock", "Eng-079");
            const stockSnap = await getDoc(stockRef);
            if (stockSnap.exists()) {
                output += JSON.stringify(stockSnap.data(), null, 2) + "\n";
            } else {
                output += "Not found.\n";
            }
        }
        return output;
    });
    console.log(result);
});
