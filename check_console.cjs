const { chromium } = require('playwright');

(async () => {
  console.log("Launching browser to check localhost:3000...");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`BROWSER CONSOLE: ${msg.type().toUpperCase()} - ${msg.text()}`));
  page.on('pageerror', exception => {
      console.error(`BROWSER UNCAUGHT EXCEPTION: ${exception}`);
  });

  try {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
      console.log("Page loaded. Waiting 2 seconds for any async errors...");
      await page.waitForTimeout(2000);
      
      // Try to login if it's on the login screen
      const isLogin = await page.$('input[type="email"]');
      if (isLogin) {
          console.log("Login screen detected. Attempting to login with 0001...");
          await page.fill('input[type="email"]', 'admin@englabs.in');
          await page.fill('input[type="password"]', '0001');
          await page.click('button[type="submit"]');
          await page.waitForTimeout(2000);
      }
      
  } catch (err) {
      console.error("Error loading page:", err);
  } finally {
      await browser.close();
  }
})();
