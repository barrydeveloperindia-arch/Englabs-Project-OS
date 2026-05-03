import json
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.units import inch

# Configuration
INPUT_JSON = 'Englabs Projects/HR & Payroll/Exports/April_2026/forensic_master_ledger.json'
OUTPUT_BASE = 'Englabs Projects/HR & Payroll/Exports/April_2026/WhatsApp_Optimized'

def generate_pdfs():
    if not os.path.exists(INPUT_JSON):
        print(f"Error: {INPUT_JSON} not found")
        return

    with open(INPUT_JSON, 'r') as f:
        ledger = json.load(f)

    for employee in ledger:
        name = employee['name']
        summary = employee['summary']
        records = employee['records']

        # 1. Generate Timesheet PDF
        ts_filename = os.path.join(OUTPUT_BASE, f"{name}_April_2026_Timesheet.pdf")
        create_timesheet_pdf(ts_filename, name, summary, records)
        
        # 2. Generate Payslip PDF
        ps_filename = os.path.join(OUTPUT_BASE, f"{name}_April_2026_Payslip.pdf")
        create_payslip_pdf(ps_filename, name, summary)

        print(f"Generated PDFs for {name}")

def create_timesheet_pdf(filename, name, summary, records):
    doc = SimpleDocTemplate(filename, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    # Title
    title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], fontSize=18, spaceAfter=20, textColor=colors.HexColor('#1a365d'))
    elements.append(Paragraph("Englabs India Pvt Ltd", title_style))
    elements.append(Paragraph(f"Individual Timesheet: {name} | April 2026", styles['Heading2']))
    elements.append(Spacer(1, 0.2*inch))

    # Table Data
    data = [['Date', 'In Time', 'Out Time', 'Total Hours', 'Overtime', 'Status']]
    for r in records:
        data.append([r['date'], r['in'], r['out'], f"{r['totalHours']}h", f"{r['ot']}h", r['status']])

    t = Table(data, hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f8fafc')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#64748b')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 0.3*inch))

    # Summary section
    summary_data = [
        ['Total Working Days', 'Total Hours', 'Total Overtime'],
        [str(summary['workingDays']), f"{summary['totalHours']}h", f"{summary['otHours']}h"]
    ]
    st = Table(summary_data, hAlign='LEFT', colWidths=[2*inch, 2*inch, 2*inch])
    st.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 1, colors.white),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(st)

    doc.build(elements)

def create_payslip_pdf(filename, name, summary):
    doc = SimpleDocTemplate(filename, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    # Header
    header_style = ParagraphStyle('HeaderStyle', parent=styles['Heading1'], alignment=1, fontSize=20, spaceAfter=10)
    elements.append(Paragraph("Englabs India Pvt Ltd", header_style))
    elements.append(Paragraph("Salary Statement | April 2026", ParagraphStyle('SubStyle', parent=styles['Normal'], alignment=1, fontSize=12, spaceAfter=30)))

    # Info Table
    info_data = [
        ['Employee Name:', name, 'Pay Period:', summary['period']],
        ['Designation:', 'Eng. Operations', 'Working Days:', str(summary['workingDays'])]
    ]
    it = Table(info_data, hAlign='LEFT', colWidths=[1.5*inch, 2*inch, 1.5*inch, 1*inch])
    it.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#64748b')),
        ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor('#64748b')),
    ]))
    elements.append(it)
    elements.append(Spacer(1, 0.5*inch))

    # Salary Table
    salary_data = [
        ['Earnings Description', 'Amount (INR)'],
        [f'Basic Component ({summary["workingDays"]} Days @ Rs.{summary["dailyRate"]}/day)', f'Rs.{summary["basicSalary"]:,.2f}'],
        [f'Overtime Premium ({summary["otHours"]}h @ Rs.{summary["otHourlyRate"]}/h)', f'Rs.{summary["otPay"]:,.2f}'],
        ['Total Gross Earnings', f'Rs.{summary["netPay"]:,.2f}'],
        ['', ''],
        ['Net Disbursement', f'Rs.{summary["netPay"]:,.2f}']
    ]
    
    st = Table(salary_data, hAlign='CENTER', colWidths=[4*inch, 1.5*inch])
    st.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('LINEBELOW', (0, 0), (-1, 0), 1, colors.black),
        ('LINEBELOW', (0, 3), (-1, 3), 1, colors.black),
        ('FONTNAME', (0, 5), (-1, 5), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 5), (-1, 5), 14),
        ('TOPPADDING', (0, 5), (-1, 5), 15),
    ]))
    elements.append(st)

    doc.build(elements)

if __name__ == "__main__":
    generate_pdfs()
