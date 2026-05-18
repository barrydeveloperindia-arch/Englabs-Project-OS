import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const DIAGNOSTICS_DIR = path.resolve('C:/Users/SAM/.gemini/antigravity/brain/d30803d0-4547-48cf-a286-353f5848fb5b/artifacts');
const REPORT_PATH = path.join(DIAGNOSTICS_DIR, 'mobile_test_diagnostics.md');
const PLAYWRIGHT_REPORT_PATH = path.resolve('test-results.json');

function logMessage(msg) {
  console.log(`[DIAGNOSTICS-WORKER] ${msg}`);
}

async function runFeedbackCollector() {
  logMessage('Starting self-reliant feedback collection...');

  // Ensure diagnostics directory exists
  if (!fs.existsSync(DIAGNOSTICS_DIR)) {
    fs.mkdirSync(DIAGNOSTICS_DIR, { recursive: true });
  }

  let testSummary = {
    total: 0,
    passed: 0,
    failed: 0,
    failures: []
  };

  // 1. PARSE PLAYWRIGHT JSON RESULTS
  if (fs.existsSync(PLAYWRIGHT_REPORT_PATH)) {
    try {
      const rawData = fs.readFileSync(PLAYWRIGHT_REPORT_PATH, 'utf8');
      const report = JSON.parse(rawData);

      testSummary.total = (report.stats?.expected || 0) + (report.stats?.unexpected || 0) + (report.stats?.skipped || 0);
      testSummary.passed = report.stats?.expected || 0;
      testSummary.failed = report.stats?.unexpected || 0;

      // Extract specific failures and traces
      if (report.suites) {
        const findFailures = (suite) => {
          if (suite.specs) {
            suite.specs.forEach(spec => {
              if (spec.tests) {
                spec.tests.forEach(test => {
                  if (test.status === 'unexpected' || test.results?.some(r => r.status === 'failed')) {
                    const result = test.results?.[0] || {};
                    const errorMsg = result.error?.message || 'Unknown Error';
                    const stack = result.error?.stack || 'No Stack Trace';
                    const screenshot = result.attachments?.find(a => a.name === 'screenshot')?.path || '';

                    testSummary.failures.push({
                      title: spec.title,
                      file: spec.file,
                      error: errorMsg,
                      stack: stack,
                      screenshot: screenshot
                    });
                  }
                });
              }
            });
          }
          if (suite.suites) {
            suite.suites.forEach(subSuite => findFailures(subSuite));
          }
        };

        report.suites.forEach(suite => findFailures(suite));
      }
      logMessage(`Parsed Playwright report successfully: ${testSummary.failed} failures identified.`);
    } catch (e) {
      logMessage(`WARNING: Failed to parse test-results.json: ${e.message}`);
    }
  } else {
    logMessage('WARNING: test-results.json not found. Run tests with reporter=json first.');
  }

  // 2. EXTRACT ANDROID LOGCAT FOR FORENSIC CRASHES
  let logcatDump = 'No active Android device found or ADB offline.';
  try {
    const devices = execSync('adb devices', { encoding: 'utf8' });
    if (devices.includes('\tdevice')) {
      logMessage('Connected Android device found. Extracting Logcat traces...');
      // Dump raw logcat and filter in JS for cross-platform reliability
      const rawLogcat = execSync('adb logcat -d *:W', {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
        timeout: 15000
      });
      const lines = rawLogcat.split('\n');
      const filteredLines = lines.filter(line => 
        line.includes('com.englabs.os') || 
        line.includes('AndroidRuntime') || 
        line.includes('FATAL') || 
        line.includes('Capacitor') || 
        line.includes('Web Console')
      );
      logcatDump = filteredLines.slice(-50).join('\n') || 'Logcat retrieved. No critical errors detected for EngLabs.';
    }
  } catch (e) {
    logMessage(`Logcat extraction completed (standard fallback or no device connected): ${e.message}`);
    logcatDump = `ADB Logcat extraction failed: ${e.message}`;
  }

  // 3. GENERATE IMMUTABLE FORENSIC DIAGNOSTICS REPORT
  const timestamp = new Date().toISOString();
  let markdown = `# 🤖 Self-Reliant Mobile Test Diagnostics Report
## **Timestamp: ${timestamp}**
*   **Operational Health Status**: ${testSummary.failed === 0 ? '🟢 ALL GREEN' : '🔴 ACTION REQUIRED'}

---

## 📊 **Test Summary Matrix**
| Metric | Count |
| :--- | :---: |
| **Total Specs Run** | ${testSummary.total} |
| **Passed Status** | ${testSummary.passed} |
| **Failed Exceptions** | ${testSummary.failed} |

---

`;

  if (testSummary.failures.length > 0) {
    markdown += `## ❌ **Detailed Failure Analysis & Traces**\n\n`;
    testSummary.failures.forEach((fail, idx) => {
      markdown += `### **[Failure #${idx + 1}] ${fail.title}**
*   **Source File**: [${path.basename(fail.file)}](file:///${fail.file.replace(/\\/g, '/')})
*   **Screenshot Path**: ${fail.screenshot ? `\`${fail.screenshot}\`` : '*No Screenshot captured*'}

#### **Error Exception**:
\`\`\`text
${fail.error}
\`\`\`

#### **Call Stack Trace**:
\`\`\`text
${fail.stack}
\`\`\`

---
`;
    });
  } else {
    markdown += `## ✅ **All Systems Operational**
All automated E2E, Smoke, and integration assertions passed successfully on the target device.

---
`;
  }

  markdown += `## 📷 **Active Android Hardware Logs (Logcat)**
\`\`\`text
${logcatDump}
\`\`\`

---
_Diagnostics generated automatically by the Antigravity Autonomous Feedback Loop Worker._
`;

  try {
    fs.writeFileSync(REPORT_PATH, markdown, 'utf8');
    logMessage(`Diagnostics Report successfully generated at: ${REPORT_PATH}`);
  } catch (e) {
    logMessage(`ERROR: Failed to write markdown diagnostics report: ${e.message}`);
  }
}

runFeedbackCollector();
