import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { execSync } from 'child_process';

const PORT = 9223;
const ARTIFACT_DIR = "C:/Users/SAM/.gemini/antigravity-ide/brain/c3287138-1f18-4313-a7ad-c84526af4e61/scratch";

const sleep = ms => new Promise(r => setTimeout(r, ms));

const fetchJson = (url) => {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch(e) { reject(e); }
            });
        }).on('error', reject);
    });
};

async function runTest() {
    try {
        console.log("Getting App PID...");
        const pid = execSync('adb -s 863d00583048303634511b176e16bc shell pidof com.englabs.projects').toString().trim();
        if (!pid) throw new Error("Could not find PID of com.englabs.projects. Is it running?");
        console.log(`App PID: ${pid}`);

        console.log("Setting up ADB forward...");
        execSync(`adb -s 863d00583048303634511b176e16bc forward tcp:${PORT} localabstract:webview_devtools_remote_${pid}`);
        console.log(execSync('adb -s 863d00583048303634511b176e16bc forward --list').toString());

        console.log(`Connecting to Android WebView on port ${PORT}...`);
        const json = await fetchJson(`http://127.0.0.1:${PORT}/json`);
        
        const appPage = json.find(p => p.url && (p.url.includes('localhost') || p.url.includes('10.0.2.2') || p.url.includes('file://') || p.url.includes('capacitor')));
        
        if (!appPage) {
            console.error("Could not find the app WebView page. Available pages:", json.map(p => p.url));
            process.exit(1);
        }

        console.log("Found App Page WebSocket URL:", appPage.webSocketDebuggerUrl);

        const browser = await puppeteer.connect({
            browserURL: `http://127.0.0.1:${PORT}`,
            defaultViewport: null
        });

        const pages = await browser.pages();
        const page = pages[0];

        console.log("Connected to WebView successfully!");

        const snap = async (name) => {
            const p = path.join(ARTIFACT_DIR, `${name}.png`).replace(/\\/g, '/');
            console.log(`Taking screenshot: ${name}`);
            try {
                execSync('adb -s 863d00583048303634511b176e16bc shell screencap -p /sdcard/s.png');
                execSync(`adb -s 863d00583048303634511b176e16bc pull /sdcard/s.png "${p}"`);
                console.log(`Saved screenshot: ${p}`);
            } catch (e) {
                console.error("Screenshot failed", e);
            }
        };

        await snap('1_initial_load');
        
        console.log("Clicking CHECK IN...");
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, a'));
            const btn = buttons.find(b => b.textContent && b.textContent.includes('CHECK IN'));
            if (btn) btn.click();
        });
        await sleep(1000);
        await snap('2_checkin_modal');

        console.log("Filling Check In form...");
        await page.evaluate(() => {
            const inputs = Array.from(document.querySelectorAll('input'));
            const qtyInput = inputs.find(i => i.placeholder && i.placeholder.includes('Qty') || i.type === 'number');
            if (qtyInput) {
                qtyInput.value = '5';
                qtyInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
        await sleep(500);
        await snap('3_checkin_filled');

        console.log("Submitting Check In...");
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const btn = buttons.find(b => b.textContent && (b.textContent.includes('Submit') || b.textContent.includes('Check In') || b.textContent.includes('Confirm') || b.textContent === 'CHECK IN'));
            if (btn) btn.click();
        });
        await sleep(2000);
        await snap('4_after_checkin');

        console.log("Clicking CHECK OUT...");
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const btn = buttons.find(b => b.textContent && b.textContent.includes('CHECK OUT'));
            if (btn) btn.click();
        });
        await sleep(1000);
        await snap('5_checkout_modal');

        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const closeBtn = buttons.find(b => b.textContent && (b.textContent.includes('Cancel') || b.textContent.includes('Close') || b.textContent.includes('X')));
            if (closeBtn) closeBtn.click();
        });
        await sleep(500);

        console.log("Clicking ADD MATERIAL...");
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const btn = buttons.find(b => b.textContent && b.textContent.includes('ADD MATERIAL'));
            if (btn) btn.click();
        });
        await sleep(1000);
        await snap('6_add_material_modal');

        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const closeBtn = buttons.find(b => b.textContent && (b.textContent.includes('Cancel') || b.textContent.includes('Close') || b.textContent.includes('X')));
            if (closeBtn) closeBtn.click();
        });
        await sleep(500);

        await browser.disconnect();
        console.log("Tests complete! Disconnected.");
        process.exit(0);
    } catch (e) {
        console.error("Test failed:", e);
        process.exit(1);
    }
}

runTest();
