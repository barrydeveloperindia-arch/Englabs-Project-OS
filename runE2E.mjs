import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const artifactsDir = 'C:\\Users\\SAM\\.gemini\\antigravity-ide\\brain\\37c1e7b9-5d15-4a52-ac0b-8a6a7fad8bac';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3000/');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const isPin = await page.$('text=SYSTEM ACCESS LOCK');
  if (isPin) {
      console.log('Bypassing PIN 0001...');
      await page.locator('button', { hasText: /^0$/ }).click();
      await page.waitForTimeout(200);
      await page.locator('button', { hasText: /^0$/ }).click();
      await page.waitForTimeout(200);
      await page.locator('button', { hasText: /^0$/ }).click();
      await page.waitForTimeout(200);
      await page.locator('button', { hasText: /^1$/ }).click();
      await page.waitForTimeout(2000);
  }

  const isHandover = await page.$('text=INITIALIZE WORKDAY');
  if (isHandover) {
      console.log('Clicking INITIALIZE WORKDAY...');
      await page.click('text=INITIALIZE WORKDAY');
      await page.waitForTimeout(2000);
  }

  // Debug screenshot
  await page.screenshot({ path: path.join(artifactsDir, '0.5_after_pin.png') });

  console.log('Clicking ERP COMMAND CENTER...');
  const erpBtn = await page.$('text=ERP COMMAND CENTER');
  if (erpBtn) {
      await erpBtn.click();
      await page.waitForTimeout(2000);
  } else {
      console.log('ERP COMMAND CENTER button not found. Using fallback onClick...');
      await page.evaluate(() => {
          const b = Array.from(document.querySelectorAll('button, div, a')).find(e => e.textContent && e.textContent.includes('ERP COMMAND CENTER'));
          if(b) b.click();
      });
      await page.waitForTimeout(2000);
  }

  const isLogin = await page.$('input[type="email"]');
  if (isLogin) {
      console.log('Logging in to ERP...');
      await page.fill('input[type="email"]', 'englabscivilteam@gmail.com');
      await page.fill('input[type="password"]', 'Ram@2026');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(4000);
  }

  console.log('Taking Dashboard BEFORE screenshot...');
  await page.screenshot({ path: path.join(artifactsDir, '1_dashboard_before.png') });

  console.log('Clicking Projects Module...');
  const projectsLink = await page.$('text=Projects');
  if (projectsLink) {
      await projectsLink.click();
      await page.waitForTimeout(2000);
      
      console.log('Locking first project...');
      const lockBtns = await page.$$('button[title="Lock this Project ID globally"]');
      if (lockBtns.length > 0) {
          await lockBtns[0].click();
          console.log('Project Locked.');
      } else {
          // Alternative fallback for project lock
          const altLock = await page.$('button:has-text("Lock")');
          if (altLock) await altLock.click();
      }
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(artifactsDir, '2_project_locked.png') });

      console.log('Clicking Vendors Module...');
      const vendorsLink = await page.$('text=Vendors');
      if (vendorsLink) await vendorsLink.click();
      await page.waitForTimeout(1000);
      const logVendorExpense = await page.$('text=Log Vendor Expense');
      if (logVendorExpense) await logVendorExpense.click();
      await page.waitForTimeout(500);
      await page.fill('input[placeholder="e.g. Raw Material, Transport"]', 'Steel Pipes');
      await page.fill('input[placeholder="0"]', '5000');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(artifactsDir, '3_vendor_expense.png') });

      console.log('Clicking Accounts & Finance...');
      const financeLink = await page.$('text=Accounts & Finance');
      if (financeLink) await financeLink.click();
      await page.waitForTimeout(1000);
      
      const financeInputs = await page.$$('input[type="text"]');
      if (financeInputs.length > 0) {
          const clientRev = await page.$('text=Client Revenue');
          if (clientRev) await clientRev.click();
          await page.waitForTimeout(500);
          await financeInputs[0].fill('Client Advance');
          if (financeInputs.length > 1) await financeInputs[1].fill('INV-2026-001');
          const financeAmounts = await page.$$('input[type="number"]');
          if (financeAmounts.length > 0) await financeAmounts[0].fill('100000'); 
          await page.click('button[type="submit"]');
          await page.waitForTimeout(2000);
          
          const logExp = await page.$('text=Log Expense');
          if (logExp) await logExp.click();
          await page.waitForTimeout(500);
          await financeInputs[0].fill('Office Supplies');
          if (financeAmounts.length > 0) await financeAmounts[0].fill('1200');
          await page.click('button[type="submit"]');
          await page.waitForTimeout(2000);
      }
      await page.screenshot({ path: path.join(artifactsDir, '4_accounts_finance.png') });

      console.log('Clicking Porter Services...');
      const porterLink = await page.$('text=Porter Services');
      if (porterLink) await porterLink.click();
      await page.waitForTimeout(1000);
      const logPorter = await page.$('text=Log Vehicle / Logistics');
      if (logPorter) await logPorter.click();
      await page.waitForTimeout(500);
      const p1 = await page.$('input[placeholder="HR-26-XX-XXXX"]');
      if (p1) await p1.fill('DL-1C-9999');
      const p2 = await page.$('input[placeholder="0"]');
      if (p2) await p2.fill('800');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(artifactsDir, '5_porter_logistics.png') });

      console.log('Clicking Food & Hospitality...');
      const foodLink = await page.$('text=Food & Hospitality');
      if (foodLink) await foodLink.click();
      await page.waitForTimeout(1000);
      const logFood = await page.$('text=Log Food Expense');
      if (logFood) await logFood.click();
      await page.waitForTimeout(500);
      const f1 = await page.$('input[placeholder="e.g. Local Canteen, Groceries"]');
      if (f1) await f1.fill('Site Lunch');
      const f2 = await page.$('input[placeholder="10"]');
      if (f2) await f2.fill('15');
      const f3 = await page.$('input[placeholder="0"]');
      if (f3) await f3.fill('1500');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(artifactsDir, '6_food_hospitality.png') });

      console.log('Back to Dashboard...');
      const dashLink = await page.$('text=Dashboard');
      if (dashLink) await dashLink.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: path.join(artifactsDir, '7_dashboard_after.png') });
  } else {
      console.log('Could not find Projects module link.');
  }

  console.log('Done.');
  await browser.close();
})();
