import json
import pandas as pd
from datetime import datetime

porter_path = r'C:\Users\SAM\Documents\Antigravity\Englabs Projects\data\porter_missions_forensic.json'
patty_path = r'C:\Users\SAM\Documents\Antigravity\Englabs Projects\src\data\monthly_patty_cash.json'

print("--- PORTER MISSIONS ADVANCES ---")
with open(porter_path, 'r', encoding='utf-8') as f:
    porter_data = json.load(f)

porter_advances = []
for p in porter_data:
    adv = p.get('advanceAmount', 0)
    if adv > 0:
        porter_advances.append({
            'date': p.get('date'),
            'time': p.get('time'),
            'id': p.get('id'),
            'porter': p.get('porterName'),
            'reason': p.get('materialDescription'),
            'under_work': p.get('customerName'),
            'amount': adv
        })

df_porter = pd.DataFrame(porter_advances)
print(df_porter.to_string(index=False))

print("\n--- MONTHLY PETTY CASH ADVANCES (CR/DR) ---")
with open(patty_path, 'r', encoding='utf-8') as f:
    patty_data = json.load(f)

patty_advances = []
for month, items in patty_data.items():
    for item in items:
        details = str(item.get('details', '')).lower()
        if 'advance' in details or 'adv ' in details or ' adv' in details:
            patty_advances.append({
                'month': month,
                'date': item.get('date'),
                'details': item.get('details'),
                'cr': item.get('cr', 0.0),
                'dr': item.get('dr', 0.0),
                'balance': item.get('balance', 0.0)
            })

df_patty = pd.DataFrame(patty_advances)
print(df_patty.to_string(index=False))
