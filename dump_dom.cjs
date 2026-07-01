const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function run() {
  console.log("Connecting to user's Chrome...");
  try {
    const browser = await puppeteer.connect({
      browserURL: 'http://127.0.0.1:9222',
      defaultViewport: null
    });

    const pages = await browser.pages();
    const targetPage = pages.find(p => p.url().includes('localhost:3000'));
    if (!targetPage) {
      console.log("Could not find localhost:3000 tab!");
      await browser.disconnect();
      return;
    }

    console.log("Page URL:", targetPage.url());
    console.log("Page Title:", await targetPage.title());

    // Dump body inner text and h3s
    const pageData = await targetPage.evaluate(() => {
      const h3s = Array.from(document.querySelectorAll('h3')).map(h => h.textContent.trim());
      const h2s = Array.from(document.querySelectorAll('h2')).map(h => h.textContent.trim());
      const activeNav = document.querySelector('.bg-emerald-500, .border-emerald-500, .text-emerald-500')?.textContent?.trim();
      return { h2s, h3s, activeNav, bodyCharCount: document.body.innerText.length };
    });

    console.log("PAGE DATA:", JSON.stringify(pageData, null, 2));

    const screenshotPath = 'C:\\Users\\SAM\\.gemini\ntigravity-ide\\brain\\c74d1426-59a2-49b1-87d9-0f5a202ccfda\\scratch\\user_browser_view.png';
    await targetPage.screenshot({ path: screenshotPath });
    console.log("Screenshot saved to:", screenshotPath);

    await browser.disconnect();
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
