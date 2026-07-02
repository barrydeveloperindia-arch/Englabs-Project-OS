import os
import json
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

# Paths
json_path = 'scratch/parsed_stock_items_cleaned.json'
output_pdf = 'G:\\HR Team Managements\\Englabs Projects APK\\Store\\Rate List Record\\Englabs_Store_Rate_Registry_Report.pdf'

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            super().showPage()
        super().save()

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#475569"))
        
        # Header
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(36, A4[1] - 40, A4[0] - 36, A4[1] - 40)
        self.drawString(36, A4[1] - 35, "ENGLABS INDIA PVT. LTD. — STORE RATE REGISTRY REPORT")
        
        # Footer
        self.line(36, 45, A4[0] - 36, 45)
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(A4[0] - 36, 32, page_text)
        self.drawString(36, 32, "Confidential — Internal Store Operations")
        self.restoreState()

def build_pdf():
    # Load compiled store items from excel generation
    # Since we already ran compile_store_registry.py, let's regenerate the list of items
    # in Python to be exactly what we put in the Excel file.
    import re
    with open('scratch/parsed_stock_items_cleaned.json', 'r', encoding='utf-8') as f:
        stock_items = json.load(f)
    with open('scratch/db_materials.json', 'r', encoding='utf-8') as f:
        db_materials = json.load(f)
    with open('scratch/purchase_rates_from_accounts.json', 'r', encoding='utf-8') as f:
        accounts_rates = json.load(f)
        
    def norm(name):
        return re.sub(r'[^a-z0-9]', '', name.lower())
        
    db_norm = {norm(item.get('name', '')): item for item in db_materials}
    accounts_norm = {norm(k): v for k, v in accounts_rates.items()}
    
    compiled = []
    for item in stock_items:
        name = item['name']
        c_rate = item['rate']
        qty_str = item['qty']
        source = item['source']
        category = item['category']
        n_name = norm(name)
        
        item_code = 'N/A'
        if n_name in db_norm:
            item_code = db_norm[n_name].get('itemCode', 'N/A')
        else:
            for k, v in db_norm.items():
                if k in n_name or n_name in k:
                    item_code = v.get('itemCode', 'N/A')
                    break
                    
        p_rate = None
        note = "Valuation Rate"
        
        if 'fevikwik' in name.lower():
            p_rate = 55.08
            note = "Sumeer Sanitary Bill"
        elif n_name in accounts_norm:
            p_rate = accounts_norm[n_name]['rate']
            note = "Accounts Master"
        else:
            p_rate = c_rate
            note = "Valuation Rate"
            
        change = c_rate - p_rate
        compiled.append({
            'name': name,
            'code': item_code,
            'category': category,
            'qty': qty_str,
            'c_rate': c_rate,
            'p_rate': p_rate,
            'change': change,
            'note': note
        })

    doc = SimpleDocTemplate(
        output_pdf,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=4
    )
    
    meta_style = ParagraphStyle(
        'MetaText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#64748B'),
        spaceAfter=15
    )
    
    section_style = ParagraphStyle(
        'SecTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=10,
        spaceAfter=6
    )
    
    cell_style = ParagraphStyle(
        'CellText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#334155')
    )
    
    cell_style_bold = ParagraphStyle(
        'CellTextBold',
        parent=cell_style,
        fontName='Helvetica-Bold'
    )
    
    cell_style_center = ParagraphStyle(
        'CellTextCenter',
        parent=cell_style,
        alignment=1 # Center
    )
    
    cell_style_right = ParagraphStyle(
        'CellTextRight',
        parent=cell_style,
        alignment=2 # Right
    )

    story = []
    
    # Document Header
    story.append(Paragraph("Englabs Store Rate Registry Report", title_style))
    story.append(Paragraph("Live Inventory Performance & Purchasing Rate Variance Diagnostics (July 2026)", meta_style))
    
    # KPI Grid
    kpi_data = [
        [
            Paragraph("<b>TOTAL UNIQUE ITEMS</b><br/><font size=14 color='#0F172A'><b>304</b></font>", cell_style_center),
            Paragraph("<b>GENERAL CONSUMABLES</b><br/><font size=14 color='#059669'><b>176</b></font>", cell_style_center),
            Paragraph("<b>RAW MATERIALS</b><br/><font size=14 color='#0284C7'><b>128</b></font>", cell_style_center),
        ]
    ]
    kpi_table = Table(kpi_data, colWidths=[174, 174, 174])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#E2E8F0')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(kpi_table)
    story.append(Spacer(1, 15))
    
    story.append(Paragraph("Master Store Item Registry", section_style))
    
    # Table headers
    table_data = [[
        Paragraph("<b>S.No.</b>", cell_style_bold),
        Paragraph("<b>Material Code</b>", cell_style_bold),
        Paragraph("<b>Item Name</b>", cell_style_bold),
        Paragraph("<b>Category</b>", cell_style_bold),
        Paragraph("<b>Qty</b>", cell_style_bold),
        Paragraph("<b>Current Rate</b>", cell_style_bold),
        Paragraph("<b>Prev Rate</b>", cell_style_bold),
        Paragraph("<b>Change</b>", cell_style_bold),
        Paragraph("<b>Source / Remarks</b>", cell_style_bold),
    ]]
    
    for idx, item in enumerate(compiled, 1):
        c_rate_str = f"rupee {item['c_rate']:.2f}".replace("rupee ", "Rs. ")
        p_rate_str = f"rupee {item['p_rate']:.2f}".replace("rupee ", "Rs. ")
        
        change_val = item['change']
        if change_val > 0:
            change_str = f"+Rs. {change_val:.2f}"
            change_color = '#DC2626'
        elif change_val < 0:
            change_str = f"-Rs. {abs(change_val):.2f}"
            change_color = '#16A34A'
        else:
            change_str = "Rs. 0.00"
            change_color = '#475569'
            
        change_para = Paragraph(f"<font color='{change_color}'><b>{change_str}</b></font>", cell_style_right)
        
        table_data.append([
            Paragraph(str(idx), cell_style_center),
            Paragraph(item['code'], cell_style_center),
            Paragraph(item['name'], cell_style),
            Paragraph(item['category'], cell_style_center),
            Paragraph(item['qty'], cell_style_center),
            Paragraph(c_rate_str, cell_style_right),
            Paragraph(p_rate_str, cell_style_right),
            change_para,
            Paragraph(item['note'], cell_style),
        ])
        
    # Column widths (A4 width is 595, margins are 36 each side, so printable width is 523)
    col_widths = [25, 55, 140, 50, 45, 50, 50, 50, 58]
    
    # Table style
    t_style = TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('TOPPADDING', (0,0), (-1,0), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ])
    
    # Header text color fix
    for i in range(len(table_data[0])):
        table_data[0][i].style.textColor = colors.white
        
    # Alternating row colors
    for i in range(1, len(table_data)):
        bg = colors.HexColor('#F8FAFC') if i % 2 == 0 else colors.white
        t_style.add('BACKGROUND', (0, i), (-1, i), bg)
        t_style.add('TOPPADDING', (0, i), (-1, i), 4)
        t_style.add('BOTTOMPADDING', (0, i), (-1, i), 4)
        
    main_table = Table(table_data, colWidths=col_widths, repeatRows=1)
    main_table.setStyle(t_style)
    story.append(main_table)
    
    doc.build(story, canvasmaker=NumberedCanvas)
    print("SUCCESS: Englabs_Store_Rate_Registry_Report.pdf compiled.")

if __name__ == '__main__':
    build_pdf()
