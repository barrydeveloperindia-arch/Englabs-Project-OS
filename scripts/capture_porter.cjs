const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1' });
    const page = await context.newPage();
    console.log('Navigating...');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(3000);
    // Login
    await page.fill('input[type="password"]', '0001');
    await page.click('button:has-text("Authorize Access")');
    await page.waitForTimeout(3000);
    
    // Click Logistics tab
    await page.click('nav button:nth-child(4)');
    await page.waitForTimeout(2000);
    
    // In Logistics view, click Porter Service
    await page.click('text=Porter Service');
    await page.waitForTimeout(2000);

    // In Porter Register, select LOGBOOK view
    await page.click('text=Logbook');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'scratch/mobile_porter_logbook.png', fullPage: true });
    console.log('Saved scratch/mobile_porter_logbook.png');

    await browser.close();
})();
