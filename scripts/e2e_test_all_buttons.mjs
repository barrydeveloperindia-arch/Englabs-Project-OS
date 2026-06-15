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

        console.log(`Connecting to Android WebView on port ${PORT}...`);
        const json = await fetchJson(`http://127.0.0.1:${PORT}/json`);
        
        const appPage = json.find(p => p.url && (p.url.includes('localhost') || p.url.includes('10.0.2.2') || p.url.includes('file://') || p.url.includes('capacitor')));
        
        if (!appPage) {
            console.error("Could not find the app WebView page.");
            process.exit(1);
        }

        const browser = await puppeteer.connect({
            browserURL: `http://127.0.0.1:${PORT}`,
            defaultViewport: null
        });

        const pages = await browser.pages();
        const page = pages[0];

        const snap = async (name) => {
            const p = path.join(ARTIFACT_DIR, `${name}.png`).replace(/\\/g, '/');
            try {
                execSync('adb -s 863d00583048303634511b176e16bc shell screencap -p /sdcard/s.png');
                execSync(`adb -s 863d00583048303634511b176e16bc pull /sdcard/s.png "${p}"`);
                console.log(`Saved screenshot: ${p}`);
            } catch (e) {
                console.error("Screenshot failed", e);
            }
        };

        const buttonsToTest = [
            'DASHBOARD',
            'CHECK IN',
            'CHECK OUT',
            'LIVE REGISTER',
            'CURRENT STOCK',
            'REPORTS',
            'REQUIREMENTS',
            'SETTINGS'
        ];

        for (const btnText of buttonsToTest) {
            console.log(`Clicking navigation button: ${btnText}`);
            await page.evaluate((text) => {
                const buttons = Array.from(document.querySelectorAll('button, a, div[role="button"]'));
                const btn = buttons.find(b => b.textContent && b.textContent.toUpperCase().includes(text.toUpperCase()));
                if (btn) btn.click();
            }, btnText);
            
            await sleep(1500); // Wait for transition and load
            await snap(`nav_${btnText.replace(/ /g, '_').toLowerCase()}`);
        }

        await browser.disconnect();
        console.log("Tests complete! Disconnected.");
        process.exit(0);
    } catch (e) {
        console.error("Test failed:", e);
        process.exit(1);
    }
}

runTest();
