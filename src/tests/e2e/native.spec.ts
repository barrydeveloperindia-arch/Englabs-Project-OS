import { test, expect, _android as android } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Englabs OS Native Android Tests', () => {
    test.setTimeout(180000); // 3 minutes timeout for native operations

    test('Full App Layout and Functionality Test', async ({}, testInfo) => {
        // Connect to the Android device via ADB
        if (!process.env.RUN_NATIVE_TESTS) {
            console.log("RUN_NATIVE_TESTS env var not set. Skipping native test.");
            test.skip();
            return;
        }
        let devices;
        try {
            devices = await android.devices();
        } catch (e) {
            console.log("ADB server not running or no Android devices available. Skipping native test.");
            test.skip();
            return;
        }
        if (devices.length === 0) {
            console.log("No Android device connected via ADB. Skipping native test.");
            test.skip();
            return;
        }
        const device = devices[0];
        
        console.log(`Connected to Android device: ${device.model()} (${device.serial()})`);
        
        // Force stop to ensure clean state
        await device.shell('am force-stop com.englabs.os');
        await new Promise(r => setTimeout(r, 1000));
        
        // Start the app
        await device.shell('am start -n com.englabs.os/com.englabs.os.MainActivity');
        
        // Connect to WebView
        let webViewContext;
        for (let i = 0; i < 30; i++) {
            try {
                webViewContext = await device.webView({ pkg: 'com.englabs.os' });
                if (webViewContext) break;
            } catch (e) {
                // Ignore and retry
            }
            await new Promise(r => setTimeout(r, 1000));
        }
        
        expect(webViewContext).toBeDefined();
        const page = await webViewContext!.page();
        
        // Wait for app to render
        await page.waitForLoadState('networkidle');

        // Bypass Lock Screen
        await page.evaluate(() => {
            localStorage.setItem('englabs_authenticated', 'true');
            localStorage.setItem('englabs_user_role', 'ADMIN');
        });
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        try {
            await page.waitForSelector('text=Mission Control', { timeout: 10000 });
        } catch (e) {
            console.log("Mission Control not found, dumping page content:");
            const content = await page.content();
            fs.writeFileSync(testInfo.outputPath('page_dump.html'), content);
            throw e;
        }

        // Helper to take ADB screenshots for diagnostics
        const takeScreenshot = async (name: string) => {
            const filename = `${name.replace(/ /g, '_')}.png`;
            const adbPath = `/sdcard/${filename}`;
            const localPath = testInfo.outputPath(filename);
            await device.shell(`screencap -p > ${adbPath}`);
            const shellBuffer = await device.shell(`cat ${adbPath}`);
            fs.writeFileSync(localPath, shellBuffer);
            await device.shell(`rm ${adbPath}`);
            console.log(`Saved screenshot to ${localPath}`);
            return localPath;
        };

        await takeScreenshot('Initial_Load');

        // Test Navigation & Layouts
        
        // 1. Projects Dashboard
        await expect(page.locator('text=Mission Control')).toBeVisible();
        await takeScreenshot('Projects_Dashboard');
        
        // 2. Open Store Stock Report
        const reportBtn = page.getByTestId('mobile-nav-btn-report');
        if (await reportBtn.isVisible()) {
            await reportBtn.click();
        } else {
            await page.locator('text=Store Stock Report').click();
        }
        await page.waitForTimeout(2000);
        await expect(page.locator('text=Store Stock Registry')).toBeVisible();
        await takeScreenshot('Store_Stock_Registry');
        
        // Check if layout is broken (e.g. horizontal overflow on mobile)
        const storeStockHeader = page.locator('header').first();
        const box = await storeStockHeader.boundingBox();
        const pageBox = await page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));
        
        // The header shouldn't be wider than the viewport if responsive design is working
        expect(box?.width).toBeLessThanOrEqual(pageBox.width);

        // 3. Navigate to Inventory Command
        const invBtn = page.getByTestId('mobile-nav-btn-inventory');
        if (await invBtn.isVisible()) {
            await invBtn.click();
        } else {
            await page.locator('text=Inventory Manager').click();
        }
        await page.waitForTimeout(2000);
        await expect(page.locator('text=Inventory Command')).toBeVisible();
        await takeScreenshot('Inventory_Command');
        
        // 4. Navigate to Gate Register
        const gateBtn = page.getByTestId('mobile-nav-btn-logistics');
        if (await gateBtn.isVisible()) {
            await gateBtn.click();
        } else {
            await page.locator('text=Logistics Command').click();
        }
        await page.waitForTimeout(2000);
        await expect(page.locator('text=Logistics Command Center')).toBeVisible();
        await takeScreenshot('Gate_Register');

        // Close the device
        await device.close();
    });
});
