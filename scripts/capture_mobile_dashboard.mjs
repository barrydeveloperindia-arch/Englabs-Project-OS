import { chromium, devices } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...devices['Pixel 5'],
    viewport: { width: 393, height: 852 } // typical modern phone
  });
  const page = await context.newPage();

  console.log("Navigating to local dev server...");
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  // wait for PIN entry
  await page.waitForSelector('text=System Access Lock', { state: 'visible', timeout: 5000 });
  
  // Enter 0001 for Admin
  await page.click('button:has-text("0")');
  await page.click('button:has-text("0")');
  await page.click('button:has-text("0")');
  await page.click('button:has-text("1")');

  // wait for login to process
  await page.waitForTimeout(1000);

  // We are now logged in as ADMIN. Since it's mobile, we should be on the HOME view (MobileDashboard)
  console.log("Logged in. Capturing screenshot...");
  await page.screenshot({ path: 'scratch/mobile_dashboard_preview.png' });

  await browser.close();
  console.log("Screenshot saved.");
})();
