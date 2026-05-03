import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

// Configuration
const RAW_DATA_PATH = 'scripts/raw_attendance.json';
const CONFIG_PATH = 'c:/Users/SAM/Documents/Antigravity/Englabs Acounts/Englabs Projects/HR & Payroll/salary_config.json';
const OUTPUT_DIR = 'Englabs Projects/HR & Payroll/Exports/April_2026';

// Ensure output directories exist
[
    OUTPUT_DIR,
    path.join(OUTPUT_DIR, 'Timesheets'),
    path.join(OUTPUT_DIR, 'Payslips'),
    path.join(OUTPUT_DIR, 'WhatsApp_Optimized')
].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function processPayroll() {
    console.log("🛠️ Starting Forensic Payroll Processing...");

    const rawData = JSON.parse(fs.readFileSync(RAW_DATA_PATH, 'utf8'));
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

    // Group by employee
    const employees = {};
    rawData.forEach(record => {
        if (!employees[record.Name]) employees[record.Name] = [];
        employees[record.Name].push(record);
    });

    const masterReport = [];
    const excelWorkbook = XLSX.utils.book_new();
    const processedRecordsMap = {};

    for (const name in employees) {
        const staffConfig = config.staff.find(s => s.name === name) || { daily_rate: 0, ot_hourly_rate: 0 };
        const records = employees[name];
        
        const processedRecords = records.map(r => {
            const inTime = parseTime(r['In Time']);
            const outTime = parseTime(r['Out Time']);
            
            let totalHours = 0;
            if (inTime && outTime) {
                totalHours = (outTime - inTime) / (1000 * 60 * 60);
            }
            
            const ot = Math.max(0, totalHours - config.standard_day_hours);
            const status = totalHours > 0 ? (totalHours < 4 ? "Half-day" : "Present") : "Absent";

            return {
                date: r.Date,
                in: r['In Time'],
                out: r['Out Time'],
                totalHours: totalHours.toFixed(2),
                ot: ot.toFixed(2),
                status
            };
        });

        processedRecordsMap[name] = processedRecords;

        const totalHours = processedRecords.reduce((sum, r) => sum + parseFloat(r.totalHours), 0);
        const totalOT = processedRecords.reduce((sum, r) => sum + parseFloat(r.ot), 0);
        const workingDays = processedRecords.filter(r => r.status !== "Absent").length;

        const basicSalary = workingDays * staffConfig.daily_rate;
        const otPay = totalOT * staffConfig.ot_hourly_rate;
        const netPay = basicSalary + otPay;

        const summary = {
            name,
            period: config.period,
            workingDays,
            totalHours: totalHours.toFixed(2),
            otHours: totalOT.toFixed(2),
            dailyRate: staffConfig.daily_rate,
            otHourlyRate: staffConfig.ot_hourly_rate,
            basicSalary,
            otPay,
            netPay
        };

        masterReport.push(summary);

        // Individual Excel Sheet
        const ws = XLSX.utils.json_to_sheet(processedRecords);
        XLSX.utils.book_append_sheet(excelWorkbook, ws, name.slice(0, 31));

        // Generate HTML files
        const tsHtml = generateTimesheetHtml(name, processedRecords, summary);
        const psHtml = generatePayslipHtml(summary);

        fs.writeFileSync(path.join(OUTPUT_DIR, 'Timesheets', `${name}_April_2026_Timesheet.html`), tsHtml);
        fs.writeFileSync(path.join(OUTPUT_DIR, 'Payslips', `${name}_April_2026_Payslip.html`), psHtml);

        console.log(`✅ Processed: ${name}`);
    }

    // Save Master Excel
    const finalWorkbook = XLSX.utils.book_new();
    const wsMaster = XLSX.utils.json_to_sheet(masterReport);
    XLSX.utils.book_append_sheet(finalWorkbook, wsMaster, "Master_Report");
    
    // Copy sheets from the temp workbook to the final one
    excelWorkbook.SheetNames.forEach(sheetName => {
        XLSX.utils.book_append_sheet(finalWorkbook, excelWorkbook.Sheets[sheetName], sheetName);
    });

    XLSX.writeFile(finalWorkbook, path.join(OUTPUT_DIR, 'EngLabs_Payroll_Master_April_2026.xlsx'));

    // Save full records for PDF generator
    const fullLedger = [];
    for (const name in employees) {
        fullLedger.push({
            name,
            summary: masterReport.find(r => r.name === name),
            records: processedRecordsMap[name] // I need to store this
        });
    }
    fs.writeFileSync(path.join(OUTPUT_DIR, 'forensic_master_ledger.json'), JSON.stringify(fullLedger, null, 2));

    // Dashboard Summary
    const dashboard = {
        totalEmployees: masterReport.length,
        totalWorkingDaysCompany: masterReport.reduce((sum, r) => sum + r.workingDays, 0),
        totalSalaryExpense: masterReport.reduce((sum, r) => sum + r.netPay, 0),
        totalOTHours: masterReport.reduce((sum, r) => sum + parseFloat(r.otHours), 0)
    };
    fs.writeFileSync(path.join(OUTPUT_DIR, 'Dashboard_Summary.json'), JSON.stringify(dashboard, null, 2));

    console.log("📊 Payroll Master Processing Complete.");
    console.log("Summary:", dashboard);
}

function parseTime(timeStr) {
    if (!timeStr || timeStr === "Missing" || timeStr === "Absent/Incomplete") return null;
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
}

function generateTimesheetHtml(name, records, summary) {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: sans-serif; padding: 40px; color: #333; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        h1 { margin: 0; color: #1a365d; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f8fafc; font-size: 12px; text-transform: uppercase; }
        .summary { margin-top: 30px; padding: 20px; background-color: #f1f5f9; border-radius: 8px; }
        .stat { display: inline-block; margin-right: 40px; }
        .label { font-size: 12px; color: #64748b; }
        .value { font-size: 18px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Englabs India Pvt Ltd</h1>
        <p>Individual Timesheet: <strong>${name}</strong> | ${summary.period}</p>
    </div>
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>In Time</th>
                <th>Out Time</th>
                <th>Total Hours</th>
                <th>Overtime</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${records.map(r => `
                <tr>
                    <td>${r.date}</td>
                    <td>${r.in}</td>
                    <td>${r.out}</td>
                    <td>${r.totalHours}h</td>
                    <td>${r.ot}h</td>
                    <td>${r.status}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    <div class="summary">
        <div class="stat"><div class="label">Total Working Days</div><div class="value">${summary.workingDays}</div></div>
        <div class="stat"><div class="label">Total Hours</div><div class="value">${summary.totalHours}h</div></div>
        <div class="stat"><div class="label">Total Overtime</div><div class="value">${summary.otHours}h</div></div>
    </div>
</body>
</html>`;
}

function generatePayslipHtml(summary) {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: sans-serif; padding: 50px; }
        .payslip { border: 1px solid #e2e8f0; padding: 40px; border-radius: 12px; max-width: 600px; margin: auto; }
        .header { text-align: center; margin-bottom: 40px; }
        .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
        .total { font-weight: bold; font-size: 20px; color: #1e40af; border-top: 2px solid #e2e8f0; margin-top: 20px; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="payslip">
        <div class="header">
            <h2>Englabs India Pvt Ltd</h2>
            <p>Salary Slip | ${summary.period}</p>
        </div>
        <div class="row"><span>Employee Name</span> <strong>${summary.name}</strong></div>
        <div class="row"><span>Working Days</span> <strong>${summary.workingDays}</strong></div>
        <div class="row"><span>Daily Rate</span> <strong>₹${summary.dailyRate}</strong></div>
        <div class="row"><span>Basic Salary</span> <strong>₹${summary.basicSalary.toLocaleString()}</strong></div>
        <div class="row"><span>Overtime Hours</span> <strong>${summary.otHours}h</strong></div>
        <div class="row"><span>Overtime Pay</span> <strong>₹${summary.otPay.toLocaleString()}</strong></div>
        <div class="total"><span>Net Payable Salary</span> <span>₹${summary.netPay.toLocaleString()}</span></div>
    </div>
</body>
</html>`;
}

processPayroll().catch(console.error);
