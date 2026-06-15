import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const SCRATCH_DIR = 'C:/Users/SAM/.gemini/antigravity-ide/brain/c3287138-1f18-4313-a7ad-c84526af4e61/scratch';

async function run() {
  console.log('Getting App PID...');
  const pidOutput = execSync('adb -s 863d00583048303634511b176e16bc shell pidof com.englabs.projects').toString().trim();
  if (!pidOutput) {
    console.error('App is not running! Launching it...');
    execSync('adb -s 863d00583048303634511b176e16bc shell monkey -p com.englabs.projects -c android.intent.category.LAUNCHER 1');
    await new Promise(r => setTimeout(r, 5000));
  }
  const pid = execSync('adb -s 863d00583048303634511b176e16bc shell pidof com.englabs.projects').toString().trim().split(' ')[0];
  console.log(`App PID: ${pid}`);

  execSync(`adb -s 863d00583048303634511b176e16bc forward tcp:9225 localabstract:webview_devtools_remote_${pid}`);
  console.log('Connecting to WebView...');

  try {
    const response = await fetch('http://127.0.0.1:9225/json');
    const targets = await response.json();
    const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('localhost'));
    
    if (!pageTarget) throw new Error('Could not find the app page target');

    const browser = await puppeteer.connect({
      browserWSEndpoint: pageTarget.webSocketDebuggerUrl,
      defaultViewport: null
    });

    const page = (await browser.pages())[0];

    // Click Check Out
    console.log('Clicking CHECK OUT...');
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent && b.textContent.includes('CHECK OUT'));
        if (btn) btn.click();
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Fill the checkout form
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

    await new Promise(r => setTimeout(r, 1000));
    
    console.log('Submitting Check Out...');
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent && (b.textContent.includes('Submit') || b.textContent.includes('Check Out') || b.textContent.includes('Confirm') || b.textContent === 'CHECK OUT'));
        if (btn) btn.click();
    });

    await new Promise(r => setTimeout(r, 3000));
    
    // Go to live register
    console.log('Going to Live Register...');
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a'));
        const liveBtn = buttons.find(b => b.textContent && b.textContent.includes('LIVE REGISTER'));
        if (liveBtn) liveBtn.click();
    });

    await new Promise(r => setTimeout(r, 2000));

    console.log('Taking screenshot...');
    const buf = await page.screenshot({ fullPage: true });
    const fp = path.join(SCRATCH_DIR, 'checkout_success.png');
    fs.writeFileSync(fp, buf);
    console.log('Saved screenshot: ' + fp);
    
    await browser.disconnect();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    execSync('adb -s 863d00583048303634511b176e16bc forward --remove tcp:9225');
  }
}

run();
