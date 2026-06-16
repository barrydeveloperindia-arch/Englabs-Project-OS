import pandas as pd
import json
import math
import os
import re

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
        
    df = pd.read_excel(xls, month)
    
    # The actual headers are usually on row 1 or 2. Looking at the dump, row 0 is title, row 1 is headers.
    # We will just iterate and find the header row.
    header_idx = None
    for i in range(5):
        row_vals = [str(x).strip() for x in df.iloc[i].values]
        if 'Date' in row_vals and 'From' in row_vals:
            header_idx = i
            break
            
    if header_idx is None:
        continue
        
    df.columns = df.iloc[header_idx]
    df = df.iloc[header_idx+1:].reset_index(drop=True)
    
    records = []
    for _, row in df.iterrows():
        date_val = clean_val(row.get('Date'))
        detail_val = clean_val(row.get('Detail Of Transition / Expenses'))
        cr_val = clean_val(row.get('Cr.'))
        dr_val = clean_val(row.get('Dr.'))
        balance_val = clean_val(row.get('BALANCE'))
        project_id_val = clean_val(row.get('Project ID'))
        project_dr_val = clean_val(row.get('Project Dr.'))
        
        # Skip completely empty rows
        if detail_val is None and cr_val is None and dr_val is None and balance_val is None:
            continue
            
        # Convert date to string if it's a datetime object
        if isinstance(date_val, pd.Timestamp):
            date_val = date_val.strftime('%Y-%m-%d')
        elif isinstance(date_val, str):
            date_val = str(date_val).strip()
            
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
