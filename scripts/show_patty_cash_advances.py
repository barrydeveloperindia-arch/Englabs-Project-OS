import pandas as pd

excel_path = r'G:\HR Team Managements\Englabs Projects APK\Patty Cash Details\Englabs Patty Cash.xlsx'
xls = pd.ExcelFile(excel_path)

for sheet in xls.sheet_names:
    if '2026' not in sheet:
        continue
    df = pd.read_excel(xls, sheet, header=None)
    print(f"\n=== Sheet: {sheet} ===")
    
    # Let's search for "advance" or "adv" in any cell
    for r in range(df.shape[0]):
        row = df.iloc[r]
        for c in range(df.shape[1]):
            val = row[c]
            if pd.notna(val) and any(k in str(val).lower() for k in ['advance', 'adv ']):
                # print the entire row with non-null values
                non_null_vals = {f"Col{idx}": v for idx, v in enumerate(row.values) if pd.notna(v)}
                print(f"Row {r}: {non_null_vals}")
                break
