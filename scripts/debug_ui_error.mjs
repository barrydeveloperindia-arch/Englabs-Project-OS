import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  try {
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });

    // Bypass PIN
    const isPin = await page.$('text=SYSTEM ACCESS LOCK');
    if (isPin) {
        await page.locator('button', { hasText: /^0$/ }).click(); await page.waitForTimeout(200);
        await page.locator('button', { hasText: /^0$/ }).click(); await page.waitForTimeout(200);
        await page.locator('button', { hasText: /^0$/ }).click(); await page.waitForTimeout(200);
        await page.locator('button', { hasText: /^1$/ }).click(); await page.waitForTimeout(2000);
    }

    await page.click('text=INITIALIZE WORKDAY');
    await page.waitForTimeout(2000);

    const erpBtn = await page.$('text=ERP COMMAND CENTER');
    if (erpBtn) await erpBtn.click();
    else await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button, div, a')).find(e => e.textContent && e.textContent.includes('ERP COMMAND CENTER')); if(b) b.click(); });
    await page.waitForTimeout(2000);

    const isLogin = await page.$('input[type="email"]');
    if (isLogin) {
        await page.fill('input[type="email"]', 'englabscivilteam@gmail.com');
        await page.fill('input[type="password"]', 'Ram@2026');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(4000);
    }
    
    await page.click('text=Projects');
    await page.waitForTimeout(1000);
    
    const lockBtns = await page.$$('button[title="Lock this Project ID globally"]');
    if (lockBtns.length > 0) {
        await lockBtns[0].click();
    } else {
        const altLock = await page.$('button:has-text("Lock")');
        if (altLock) await altLock.click();
    }

    await page.click('text=Vendors');
    await page.waitForTimeout(1000);
    
    const logVendorExpense = await page.$('text=Log Vendor Expense');
    if (logVendorExpense) await logVendorExpense.click();
    await page.waitForTimeout(500);
    const vInputs = await page.$$('input[type="text"]');
    if(vInputs.length > 0) await vInputs[0].fill('Steel Pipes');
    const vNums = await page.$$('input[type="number"]');
    if(vNums.length > 0) await vNums[0].fill('5000');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
  } catch (e) {
    console.error("Test failed:", e);
  } finally {
    await browser.close();
  }
})();
