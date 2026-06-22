import pandas as pd
import json
import math
import os

excel_path = r'G:\HR Team Managements\Englabs Projects APK\Patty Cash Details\Englabs Patty Cash.xlsx'
output_path = r'C:\Users\SAM\Documents\Antigravity\Englabs Projects\src\data\monthly_patty_cash.json'

xls = pd.ExcelFile(excel_path)
months = ['Jan_2026', 'Feb_2026', 'Mar_2026', 'Apr_2026', 'May_2026', 'Jun_2026']

all_data = {}

def clean_val(val):
    if pd.isna(val) or val == ' ' or val == '':
        return None
    if isinstance(val, float) and math.isnan(val):
        return None
    return val

def safe_float(val):
    if val is None:
        return 0.0
    try:
        return float(val)
    except ValueError:
        return 0.0

for month in months:
    if month not in xls.sheet_names:
        continue
        
    df = pd.read_excel(xls, month, header=None)
    
    # 1. Locate header_row_idx where Date and From headers exist
    header_row_idx = None
    for r in range(min(5, df.shape[0])):
        row_vals = [str(x).strip().lower() for x in df.iloc[r].values]
        if 'date' in row_vals and 'from' in row_vals:
            header_row_idx = r
            break
            
    if header_row_idx is None:
        print(f"Skipping sheet {month} - Date/From header row not found.")
        continue
        
    # 2. Map columns dynamically scanning headers in rows 0 to header_row_idx + 1
    col_mapping = {
        'date': 0,
        'from': 1,
        'mode': 2,
        'received': 3,
        'details': 4,
        'cr': 5,
        'dr': 6,
        'balance': 7,
        'project_dr': None,
        'project_id': None
    }
    
    for r in range(header_row_idx + 1):
        for c in range(df.shape[1]):
            val = df.iloc[r, c]
            if pd.isna(val):
                continue
            val_str = str(val).strip().lower()
            
            if val_str == 'date':
                col_mapping['date'] = c
            elif val_str == 'from':
                col_mapping['from'] = c
            elif 'mode of' in val_str:
                col_mapping['mode'] = c
            elif 'recieved' in val_str or 'received' in val_str:
                col_mapping['received'] = c
            elif 'detail' in val_str or 'expenses' in val_str:
                col_mapping['details'] = c
            elif val_str in ['cr.', 'cr']:
                col_mapping['cr'] = c
            elif val_str in ['dr.', 'dr']:
                col_mapping['dr'] = c
            elif val_str == 'balance':
                col_mapping['balance'] = c
            elif 'project dr' in val_str or 'project_dr' in val_str:
                col_mapping['project_dr'] = c
            elif 'project id' in val_str or 'project_id' in val_str or val_str == 'c-xxxx':
                col_mapping['project_id'] = c

    # 3. Parse entries starting from header_row_idx + 2
    records = []
    for r_idx in range(header_row_idx + 2, df.shape[0]):
        row = df.iloc[r_idx]
        
        date_val = clean_val(row[col_mapping['date']]) if col_mapping['date'] is not None else None
        detail_val = clean_val(row[col_mapping['details']]) if col_mapping['details'] is not None else None
        cr_val = clean_val(row[col_mapping['cr']]) if col_mapping['cr'] is not None else None
        dr_val = clean_val(row[col_mapping['dr']]) if col_mapping['dr'] is not None else None
        balance_val = clean_val(row[col_mapping['balance']]) if col_mapping['balance'] is not None else None
        project_id_val = clean_val(row[col_mapping['project_id']]) if col_mapping['project_id'] is not None else None
        project_dr_val = clean_val(row[col_mapping['project_dr']]) if col_mapping['project_dr'] is not None else None
        
        # Skip completely empty rows
        if date_val is None and detail_val is None and cr_val is None and dr_val is None and balance_val is None:
            continue
            
        if isinstance(date_val, pd.Timestamp) or hasattr(date_val, 'strftime'):
            date_val = date_val.strftime('%Y-%m-%d')
            
        records.append({
            'date': str(date_val) if date_val else None,
            'details': str(detail_val) if detail_val else '-',
            'cr': safe_float(cr_val),
            'dr': safe_float(dr_val),
            'balance': safe_float(balance_val),
            'projectId': str(project_id_val) if project_id_val else None,
            'projectDr': safe_float(project_dr_val)
        })
        
    all_data[month] = records

os.makedirs(os.path.dirname(output_path), exist_ok=True)
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(all_data, f, indent=4)

print(f"Successfully extracted data for {list(all_data.keys())} and saved to {output_path}")
