import { test, expect } from '@playwright/test';

test('check all local caches', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000); 
    
    const caches = await page.evaluate(() => {
        return {
            queue: window.localStorage.getItem('englabs_offline_tx_queue'),
            overrides: window.localStorage.getItem('local_stock_overrides'),
            currentStock: window.localStorage.getItem('local_current_stock')
        };
    });
    console.log("CACHE STATE:", caches);
});
