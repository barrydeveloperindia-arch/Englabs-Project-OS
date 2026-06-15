import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const SCRATCH_DIR = 'C:/Users/SAM/.gemini/antigravity-ide/brain/c3287138-1f18-4313-a7ad-c84526af4e61/scratch';

async function run() {
  console.log('Getting App PID...');
  const pidOutput = execSync('adb -s 863d00583048303634511b176e16bc shell pidof com.englabs.projects').toString().trim();
  if (!pidOutput) {
    console.error('App is not running!');
    process.exit(1);
  }
  const pid = pidOutput.split(' ')[0];
  console.log(`App PID: ${pid}`);

  console.log('Setting up ADB forward...');
  execSync(`adb -s 863d00583048303634511b176e16bc forward tcp:9224 localabstract:webview_devtools_remote_${pid}`);
  console.log('Connecting to Android WebView on port 9224...');

  try {
    const response = await fetch('http://127.0.0.1:9224/json');
    const targets = await response.json();
    const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('localhost'));
    
    if (!pageTarget) {
      throw new Error('Could not find the app page target');
    }

    const browser = await puppeteer.connect({
      browserWSEndpoint: pageTarget.webSocketDebuggerUrl,
      defaultViewport: null
    });

    const pages = await browser.pages();
    const page = pages[0];

    // Navigate to Live Register
    console.log('Clicking LIVE REGISTER tab...');
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a'));
        const liveBtn = buttons.find(b => b.textContent && b.textContent.includes('LIVE REGISTER'));
        if (liveBtn) liveBtn.click();
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('Taking screenshot...');
    const buf = await page.screenshot({ fullPage: true });
    const fp = path.join(SCRATCH_DIR, 'fresh_live_register.png');
    fs.writeFileSync(fp, buf);
    console.log('Saved screenshot: ' + fp);
    
    await browser.disconnect();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    execSync('adb -s 863d00583048303634511b176e16bc forward --remove tcp:9224');
  }
}

run();
