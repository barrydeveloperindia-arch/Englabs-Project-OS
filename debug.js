import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));
  
  await page.goto('http://localhost:3000/');
  await page.evaluate(() => {
    localStorage.setItem('englabs_authenticated', 'true');
    localStorage.setItem('englabs_user_role', 'ADMIN');
  });
  await page.goto('http://localhost:3000/');
  
  await page.waitForTimeout(2000);
  try {
    await page.click('button:has-text("Initialize Workday")');
    console.log("Clicked Initialize Workday");
  } catch(e) {}
  
  await page.waitForTimeout(5000);
  await page.waitForTimeout(1000);
  const content = await page.content();
  console.log('Finished waiting. Dump length:', content.length);
  import('fs').then(fs => fs.writeFileSync('dom.html', content));
  await browser.close();
})();
