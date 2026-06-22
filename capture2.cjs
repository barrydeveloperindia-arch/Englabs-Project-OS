const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
      await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000); 
      
      const isLogin = await page.$('input[type="email"]');
      if (isLogin) {
          await page.fill('input[type="email"]', 'admin@englabs.in');
          await page.fill('input[type="password"]', '0001');
          await page.click('button[type="submit"]');
          await page.waitForTimeout(3000); 
      }

      const screenshotPath = path.join('C:', 'Users', 'SAM', '.gemini', 'antigravity-ide', 'brain', '21ac6e22-a662-46fe-b823-4a3e2d112e7d', 'artifacts', 'dashboard.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`Screenshot saved to ${screenshotPath}`);
      
  } catch (err) {
      console.error(err);
  } finally {
      await browser.close();
      process.exit(0);
  }
})();
