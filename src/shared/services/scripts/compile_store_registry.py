import os
import re
import json
import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils import get_column_letter

# Paths
pdf_items_path = 'scratch/parsed_stock_items_cleaned.json'
db_materials_path = 'scratch/db_materials.json'
accounts_rates_path = 'scratch/purchase_rates_from_accounts.json'
req_list_path = 'G:\\HR Team Managements\\Englabs Projects APK\\Material Requirment List\\June-2026\\Requirement_List_June_2026.xlsx'
new_list_path = 'G:\\HR Team Managements\\Englabs Projects APK\\Purchased Invoice Details\\Material_Requirement_List.xlsx'
output_excel = 'G:\\HR Team Managements\\Englabs Projects APK\\Store\\Rate List Record\\Englabs_Store_Rate_Registry_2026.xlsx'

# Load data
with open(pdf_items_path, 'r', encoding='utf-8') as f:
    stock_items = json.load(f)
    
with open(db_materials_path, 'r', encoding='utf-8') as f:
    db_materials = json.load(f)
    
with open(accounts_rates_path, 'r', encoding='utf-8') as f:
    accounts_rates = json.load(f)

# Helper: normalize names for matching
def norm(name):
    return re.sub(r'[^a-z0-9]', '', name.lower())

db_norm = {norm(item.get('name', '')): item for item in db_materials}
accounts_norm = {norm(k): v for k, v in accounts_rates.items()}

# Parse Requirement_List_June_2026.xlsx for Old Rate
req_rates = {}
if os.path.exists(req_list_path):
    try:
        wb = openpyxl.load_workbook(req_list_path, data_only=True)
        sheet = wb.active
        for r in range(2, sheet.max_row + 1):
            name = sheet.cell(row=r, column=2).value
            old_rate = sheet.cell(row=r, column=5).value
            mkt_rate = sheet.cell(row=r, column=6).value
            if name:
                req_rates[norm(str(name))] = {
                    'old_rate': float(old_rate) if old_rate is not None else None,
                    'mkt_rate': float(mkt_rate) if mkt_rate is not None else None
                }
    except Exception as e:
        print("Error parsing June requirements:", e)

# Parse Material_Requirement_List.xlsx for rates
new_list_rates = {}
if os.path.exists(new_list_path):
    try:
        wb = openpyxl.load_workbook(new_list_path, data_only=True)
        # Check "New list" sheet
        if 'New list' in wb.sheetnames:
            sheet = wb['New list']
            for r in range(2, sheet.max_row + 1):
                name = sheet.cell(row=r, column=2).value
                rate = sheet.cell(row=r, column=8).value
                if name and rate is not None:
                    new_list_rates[norm(str(name))] = float(rate)
    except Exception as e:
        print("Error parsing material requirement list:", e)

# Compile master rate list
compiled_list = []

for idx, item in enumerate(stock_items):
    name = item['name']
    c_rate = item['rate']
    qty_str = item['qty']
    source = item['source']
    category = item['category']
    n_name = norm(name)
    
    # 1. Match Material Code
    item_code = 'N/A'
    if n_name in db_norm:
        item_code = db_norm[n_name].get('itemCode', 'N/A')
    else:
        # Substring search
        for k, v in db_norm.items():
            if k in n_name or n_name in k:
                item_code = v.get('itemCode', 'N/A')
                break
                
    # 2. Match Previous Rate (Last purchase rate)
    p_rate = None
    note = "Valuation Rate"
    
    # Check Sumeer bill for Fevikwik (hardcoded)
    if 'fevikwik' in name.lower():
        p_rate = 55.08
        note = "Extracted from Sumeer Sanitary Bill (16-Jun-2026)"
    elif n_name in req_rates and req_rates[n_name]['old_rate'] is not None:
        p_rate = req_rates[n_name]['old_rate']
        note = "Extracted from June Requirement List (Old Rate)"
    elif n_name in new_list_rates:
        p_rate = new_list_rates[n_name]
        note = "Extracted from Material Requirement List"
    elif n_name in accounts_norm:
        p_rate = accounts_norm[n_name]['rate']
        note = f"Extracted from Accounts Master (Date: {accounts_norm[n_name]['date']})"
    else:
        # Fuzzy match substring
        for k, v in accounts_norm.items():
            if k in n_name or n_name in k:
                p_rate = v['rate']
                note = f"Extracted from Accounts (Fuzzy Match: {v['date']})"
                break
                
    if p_rate is None:
        # Default previous rate to current rate (no price change or no record)
        p_rate = c_rate
        note = "No transaction history, showing current valuation rate"
        
    change = c_rate - p_rate
    change_pct = (change / p_rate) * 100 if p_rate > 0 else 0.0
    
    compiled_list.append({
        'name': name,
        'code': item_code,
        'category': category,
        'qty': qty_str,
        'c_rate': c_rate,
        'p_rate': p_rate,
        'change': change,
        'change_pct': change_pct,
        'source': source,
        'note': note
    })

# Write to Excel
wb = openpyxl.Workbook()

# Sheet 1: Dashboard
ws_dash = wb.active
ws_dash.title = "Rate_Dashboard"
ws_dash.views.sheetView[0].showGridLines = True

# Colors
navy_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
emerald_fill = PatternFill(start_color="059669", end_color="059669", fill_type="solid")
accent_fill = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
card_fill = PatternFill(start_color="0F172A", end_color="0F172A", fill_type="solid") # Dark mode card

title_font = Font(name="Calibri", size=18, bold=True, color="1E293B")
subtitle_font = Font(name="Calibri", size=11, italic=True, color="64748B")
section_font = Font(name="Calibri", size=13, bold=True, color="1E293B")
card_title_font = Font(name="Calibri", size=10, bold=True, color="94A3B8")
card_val_font = Font(name="Calibri", size=20, bold=True, color="FFFFFF")

thin_border = Border(
    left=Side(style='thin', color='E2E8F0'),
    right=Side(style='thin', color='E2E8F0'),
    top=Side(style='thin', color='E2E8F0'),
    bottom=Side(style='thin', color='E2E8F0')
)

# Set up Dashboard Title
ws_dash['A1'] = "ENGLABS STORE RATE REGISTRY"
ws_dash['A1'].font = title_font
ws_dash['A2'] = "Historical Purchasing Performance & Current Rates Analysis (Live 2026)"
ws_dash['A2'].font = subtitle_font

# Card 1: Total Items
ws_dash.merge_cells('A4:B4')
ws_dash['A4'] = "TOTAL STORE ITEMS"
ws_dash['A4'].font = card_title_font
ws_dash['A4'].alignment = Alignment(horizontal="center")
ws_dash.merge_cells('A5:B5')
ws_dash['A5'] = len(compiled_list)
ws_dash['A5'].font = card_val_font
ws_dash['A5'].alignment = Alignment(horizontal="center")

# Card 2: General Store Items
ws_dash.merge_cells('C4:D4')
ws_dash['C4'] = "GENERAL ITEMS"
ws_dash['C4'].font = card_title_font
ws_dash['C4'].alignment = Alignment(horizontal="center")
ws_dash.merge_cells('C5:D5')
ws_dash['C5'] = len([i for i in stock_items if i['category'] == 'General'])
ws_dash['C5'].font = card_val_font
ws_dash['C5'].alignment = Alignment(horizontal="center")

# Card 3: Raw Materials
ws_dash.merge_cells('E4:F4')
ws_dash['E4'] = "RAW MATERIALS"
ws_dash['E4'].font = card_title_font
ws_dash['E4'].alignment = Alignment(horizontal="center")
ws_dash.merge_cells('E5:F5')
ws_dash['E5'] = len([i for i in stock_items if i['category'] == 'Raw Material'])
ws_dash['E5'].font = card_val_font
ws_dash['E5'].alignment = Alignment(horizontal="center")

# Apply card styling
for row in [4, 5]:
    for col in range(1, 7):
        cell = ws_dash.cell(row=row, column=col)
        cell.fill = card_fill

# Sheet 2: Store_Rate_Registry
ws_reg = wb.create_sheet(title="Store_Rate_Registry")
ws_reg.views.sheetView[0].showGridLines = True

headers = [
    "S.No.", "Item Name", "Material Code", "Category", 
    "Current Qty", "Current Rate (₹)", "Previous Rate (₹)", 
    "Rate Change (₹)", "Change %", "Source Document", "Remarks / Notes"
]

# Header Row
for col_idx, h in enumerate(headers, 1):
    cell = ws_reg.cell(row=1, column=col_idx)
    cell.value = h
    cell.font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    cell.fill = navy_fill
    cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

ws_reg.row_dimensions[1].height = 28

# Write data rows
for r_idx, item in enumerate(compiled_list, 2):
    ws_reg.cell(row=r_idx, column=1, value=r_idx - 1).alignment = Alignment(horizontal="center")
    ws_reg.cell(row=r_idx, column=2, value=item['name']).alignment = Alignment(horizontal="left")
    ws_reg.cell(row=r_idx, column=3, value=item['code']).alignment = Alignment(horizontal="center")
    ws_reg.cell(row=r_idx, column=4, value=item['category']).alignment = Alignment(horizontal="center")
    ws_reg.cell(row=r_idx, column=5, value=item['qty']).alignment = Alignment(horizontal="center")
    
    # Rates
    c_cell = ws_reg.cell(row=r_idx, column=6, value=item['c_rate'])
    c_cell.number_format = '₹#,##0.00'
    c_cell.alignment = Alignment(horizontal="right")
    
    p_cell = ws_reg.cell(row=r_idx, column=7, value=item['p_rate'])
    p_cell.number_format = '₹#,##0.00'
    p_cell.alignment = Alignment(horizontal="right")
    
    # Change
    ch_cell = ws_reg.cell(row=r_idx, column=8, value=item['change'])
    ch_cell.number_format = '₹#,##0.00'
    ch_cell.alignment = Alignment(horizontal="right")
    
    pct_cell = ws_reg.cell(row=r_idx, column=9, value=item['change_pct']/100.0) # divide by 100 for percentage formatting
    pct_cell.number_format = '0.00%'
    pct_cell.alignment = Alignment(horizontal="right")
    
    # Colors for rate changes
    if item['change'] > 0:
        ch_cell.font = Font(name="Calibri", size=10, bold=True, color="DC2626") # Red text
        pct_cell.font = Font(name="Calibri", size=10, bold=True, color="DC2626")
    elif item['change'] < 0:
        ch_cell.font = Font(name="Calibri", size=10, bold=True, color="16A34A") # Green text
        pct_cell.font = Font(name="Calibri", size=10, bold=True, color="16A34A")
        
    ws_reg.cell(row=r_idx, column=10, value=item['source']).alignment = Alignment(horizontal="left")
    ws_reg.cell(row=r_idx, column=11, value=item['note']).alignment = Alignment(horizontal="left")
    
    # Border & striping
    bg_color = "F8FAFC" if r_idx % 2 == 0 else "FFFFFF"
    fill = PatternFill(start_color=bg_color, end_color=bg_color, fill_type="solid")
    for col_idx in range(1, len(headers) + 1):
        c = ws_reg.cell(row=r_idx, column=col_idx)
        c.border = thin_border
        if col_idx not in [8, 9] or item['change'] == 0:
            c.fill = fill

# Auto-fit columns
for col in ws_reg.columns:
    max_len = 0
    col_let = get_column_letter(col[0].column)
    for cell in col:
        if cell.value:
            if cell.column in [6, 7, 8] and isinstance(cell.value, (int, float)):
                val_len = len(f"₹{cell.value:,.2f}")
            else:
                val_len = len(str(cell.value))
            if val_len > max_len:
                max_len = val_len
    ws_reg.column_dimensions[col_let].width = max(max_len + 3, 10)

ws_reg.column_dimensions['B'].width = 35 # Item name fixed width
ws_reg.column_dimensions['K'].width = 35 # Note fixed width

wb.save(output_excel)
print("SUCCESS: Englabs_Store_Rate_Registry_2026.xlsx compiled.")
