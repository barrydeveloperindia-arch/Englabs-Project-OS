import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const artifactsDir = 'C:\\Users\\SAM\\.gemini\\antigravity-ide\\brain\\37c1e7b9-5d15-4a52-ac0b-8a6a7fad8bac';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const takeScreenshot = async (name) => {
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(artifactsDir, name) });
    console.log(`Saved screenshot: ${name}`);
  };

  try {
    console.log('Navigating to app...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });

    // Bypass PIN
    const isPin = await page.$('text=SYSTEM ACCESS LOCK');
    if (isPin) {
        await page.locator('button', { hasText: /^0$/ }).click(); await page.waitForTimeout(200);
        await page.locator('button', { hasText: /^0$/ }).click(); await page.waitForTimeout(200);
        await page.locator('button', { hasText: /^0$/ }).click(); await page.waitForTimeout(200);
        await page.locator('button', { hasText: /^1$/ }).click(); await page.waitForTimeout(2000);
    }

    // Handover
    const isHandover = await page.$('text=INITIALIZE WORKDAY');
    if (isHandover) {
        await page.click('text=INITIALIZE WORKDAY');
        await page.waitForTimeout(2000);
    }

    // ERP Command Center
    const erpBtn = await page.$('text=ERP COMMAND CENTER');
    if (erpBtn) await erpBtn.click();
    else await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button, div, a')).find(e => e.textContent && e.textContent.includes('ERP COMMAND CENTER')); if(b) b.click(); });
    await page.waitForTimeout(2000);

    // Login
    const isLogin = await page.$('input[type="email"]');
    if (isLogin) {
        await page.fill('input[type="email"]', 'englabscivilteam@gmail.com');
        await page.fill('input[type="password"]', 'Ram@2026');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(4000);
    }
    
    await takeScreenshot('1_Auth_Success.png');
    await takeScreenshot('2_Dashboard_Before.png');

    // Projects Module
    await page.click('text=Projects');
    await page.waitForTimeout(1000);
    
    // Lock Project
    const lockBtns = await page.$$('button[title="Lock this Project ID globally"]');
    if (lockBtns.length > 0) {
        await lockBtns[0].click();
    } else {
        const altLock = await page.$('button:has-text("Lock")');
        if (altLock) await altLock.click();
    }
    await takeScreenshot('4_Project_Locked.png');

    // Inventory
    const storeLink = await page.$('text=Store & Inventory');
    if (storeLink) await storeLink.click();
    await page.waitForTimeout(1000);
    const materialIn = await page.$('text=Material IN');
    if (materialIn) await materialIn.click();
    await page.waitForTimeout(500);
    const matInputs = await page.$$('input[type="text"]');
    if (matInputs.length > 0) await matInputs[0].fill('Cement Bags');
    const matNums = await page.$$('input[type="number"]');
    if (matNums.length > 0) await matNums[0].fill('100'); // qty
    if (matNums.length > 1) await matNums[1].fill('400'); // rate
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();
    await page.waitForTimeout(1000);
    await takeScreenshot('5_Material_IN.png');

    // Vendors
    const vendorsLink = await page.$('text=Vendors');
    if (vendorsLink) await vendorsLink.click();
    await page.waitForTimeout(1000);
    
    // Instead of looking for specific placeholder which failed, just look for text input
    const logVendorExpense = await page.$('text=Log Vendor Expense');
    if (logVendorExpense) await logVendorExpense.click();
    await page.waitForTimeout(500);
    const vInputs = await page.$$('input[type="text"]');
    if(vInputs.length > 0) await vInputs[0].fill('Steel Pipes');
    const vNums = await page.$$('input[type="number"]');
    if(vNums.length > 0) await vNums[0].fill('5000');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    await takeScreenshot('6_Vendor_Expense.png');

    // Accounts
    const financeLink = await page.$('text=Accounts & Finance');
    if (financeLink) await financeLink.click();
    await page.waitForTimeout(1000);
    const logRev = await page.$('text=Client Revenue');
    if (logRev) await logRev.click();
    await page.waitForTimeout(500);
    const fInputs = await page.$$('input[type="text"]');
    if (fInputs.length > 0) await fInputs[0].fill('Advance Payment');
    const fNums = await page.$$('input[type="number"]');
    if (fNums.length > 0) await fNums[0].fill('150000');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    await takeScreenshot('7_Accounts_Revenue.png');

    // Porter
    const porterLink = await page.$('text=Porter Services');
    if (porterLink) await porterLink.click();
    await page.waitForTimeout(1000);
    const logPorter = await page.$('text=Log Vehicle');
    if (logPorter) await logPorter.click();
    await page.waitForTimeout(500);
    const pInputs = await page.$$('input[type="text"]');
    if(pInputs.length > 0) await pInputs[0].fill('Truck HR-26');
    const pNums = await page.$$('input[type="number"]');
    if(pNums.length > 0) await pNums[0].fill('2500');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    await takeScreenshot('8_Porter_Services.png');

    // Food
    const foodLink = await page.$('text=Food & Hospitality');
    if (foodLink) await foodLink.click();
    await page.waitForTimeout(1000);
    const logFood = await page.$('text=Log Food');
    if (logFood) await logFood.click();
    await page.waitForTimeout(500);
    const foInputs = await page.$$('input[type="text"]');
    if(foInputs.length > 0) await foInputs[0].fill('Site Lunch');
    const foNums = await page.$$('input[type="number"]');
    if(foNums.length > 0) await foNums[0].fill('15');
    if(foNums.length > 1) await foNums[1].fill('1500');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    await takeScreenshot('9_Food_Expense.png');

    // Back to Dashboard
    const dashLink = await page.$('text=Dashboard');
    if (dashLink) await dashLink.click();
    await page.waitForTimeout(3000);
    await takeScreenshot('10_Dashboard_After.png');
    
  } catch (e) {
    console.error("Test failed:", e);
  } finally {
    console.log('Done.');
    await browser.close();
  }
})();
