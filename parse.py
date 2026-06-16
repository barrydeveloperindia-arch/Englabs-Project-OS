import pandas as pd
import json
import os
import math

excel_path = r'G:\HR Team Managements\Englabs Projects APK\Patty Cash Details\Englabs Patty Cash.xlsx'
out_dir = r'C:\Users\SAM\Documents\Antigravity\Englabs Projects\src\data'
out_path = os.path.join(out_dir, 'patty_cash.json')

os.makedirs(out_dir, exist_ok=True)

df = pd.read_excel(excel_path)
df.columns = [
    'SR_NO', 'ProjectId', 'CustomerName', 'CustomerLocation', 'DeliveryFeeMode', 
    'PONumber', 'TotalCost', 'VendorName', 'VendorLocation', 'PerVisitCost', 
    'ExpectedVisits', 'TotalVisitCost', 'RawMaterial', 'BudgetDispatch', 
    'DrApril', 'DrMay', 'DrJune', 'DrJuly', 'DrAug', 'DrSep', 'DrOct', 
    'DrNov', 'DrDec', 'ProfitLoss'
]

# Skip the first row as it contains secondary headers
df = df.iloc[1:]

records = []
for _, row in df.iterrows():
    r = row.to_dict()
    # Skip rows without ProjectId
    if pd.isna(r['ProjectId']) or str(r['ProjectId']).strip() == '':
        continue
    
    clean_r = {}
    for k, v in r.items():
        if pd.isna(v) or v == ' ':
            clean_r[k] = None
        else:
            clean_r[k] = v
            
    records.append(clean_r)

with open(out_path, 'w') as f:
    json.dump(records, f, indent=4)

print(f"Successfully exported {len(records)} records to {out_path}")
