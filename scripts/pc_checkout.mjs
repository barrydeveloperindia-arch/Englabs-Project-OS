import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCRATCH_DIR = 'C:/Users/SAM/.gemini/antigravity-ide/brain/c3287138-1f18-4313-a7ad-c84526af4e61/scratch';

async function run() {
    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    console.log('Navigating to localhost:3000...');
    await page.goto('http://localhost:3000');
    
    // Wait for the app to load
    await page.waitForTimeout(2000);
    
    console.log('Clicking CHECK OUT...');
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent && b.textContent.includes('CHECK OUT'));
        if (btn) btn.click();
    });
    
    await page.waitForTimeout(1000);
    
    console.log('Filling form...');
    await page.evaluate(() => {
        // Find Qty input
        const inputs = Array.from(document.querySelectorAll('input'));
        const qtyInput = inputs.find(i => i.placeholder && i.placeholder.includes('Qty') || i.type === 'number');
        if (qtyInput) {
            qtyInput.value = '1';
            qtyInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Find standard select dropdowns for React/Tailwind forms
        const selects = Array.from(document.querySelectorAll('select'));
        if (selects.length > 0) {
            // First select is usually material
            const materialSelect = selects[0];
            if (materialSelect.options.length > 1) {
                materialSelect.selectedIndex = 1;
                materialSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    });
    
    await page.waitForTimeout(1000);
    
    console.log('Submitting Check Out...');
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent && (b.textContent.includes('Submit') || b.textContent.includes('Check Out') || b.textContent.includes('Confirm') || b.textContent === 'CHECK OUT'));
        if (btn) btn.click();
    });
    
    await page.waitForTimeout(3000);
    
    console.log('Going to Live Register...');
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a'));
        const liveBtn = buttons.find(b => b.textContent && b.textContent.includes('LIVE REGISTER'));
        if (liveBtn) liveBtn.click();
    });
    
    await page.waitForTimeout(2000);
    
    console.log('Taking screenshot...');
    await page.screenshot({ path: path.join(SCRATCH_DIR, 'checkout_success.png'), fullPage: true });
    
    await browser.close();
    console.log('Done.');
}

run().catch(console.error);
