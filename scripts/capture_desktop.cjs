const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    console.log('Navigating...');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(3000);
    // Login with the PIN 2580
    try {
        await page.click('button:text-is("2")', { timeout: 3000 });
        await page.click('button:text-is("5")');
        await page.click('button:text-is("8")');
        await page.click('button:text-is("0")');
        await page.waitForTimeout(3000); // wait for dashboard to load
    } catch(e) {
        console.log("Login screen not found or already logged in.");
    }
    
    await page.screenshot({ path: 'scratch/desktop_sidebar_new.png', fullPage: true });
    console.log('Saved scratch/desktop_sidebar_new.png');
    await browser.close();
})();
