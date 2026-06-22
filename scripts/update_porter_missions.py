import json
import pandas as pd
import math
import os

excel_path = r'G:\HR Team Managements\Englabs Projects APK\Porter Team\Log Book of Bike  - CH0-1AB-5781.xlsx'
json_path = r'C:\Users\SAM\Documents\Antigravity\Englabs Projects\data\porter_missions_forensic.json'

def clean_val(val):
    if pd.isna(val) or val == ' ' or val == '':
        return None
    return val

# Load current JSON
with open(json_path, 'r', encoding='utf-8') as f:
    trips = json.load(f)

# Load June sheet
df = pd.read_excel(excel_path, sheet_name='June', header=None)

# We know the rows are:
# SR 6: Index 14 in df (row 15 in excel)
# SR 7: Index 15 in df (row 16 in excel)
# SR 8: Index 16 in df (row 17 in excel)
# SR 9: Index 17 in df (row 18 in excel)
# SR 10: Index 18 in df (row 19 in excel)

# Let's map columns from Row 8 (Index 8 in df)
# Col 4: SR. NO.
# Col 5: Date
# Col 6: Travel summery
# Col 7: Travel reason
# Col 8: Under Work
# Col 9: KM
# Col 10: RATE
# Col 11: AMOUNT
# Col 12: Advance
# Col 13: Balance

def parse_row(row_idx, trip_id):
    row = df.iloc[row_idx]
    date_val = row[5]
    if isinstance(date_val, pd.Timestamp) or hasattr(date_val, 'strftime'):
        date_str = date_val.strftime('%Y-%m-%d')
    else:
        date_str = str(date_val).split(' ')[0] if pd.notna(date_val) else None
        
    summary = str(row[6]).strip() if pd.notna(row[6]) else ''
    reason = str(row[7]).strip() if pd.notna(row[7]) else ''
    under_work = str(row[8]).strip() if pd.notna(row[8]) else ''
    km = float(row[9]) if pd.notna(row[9]) else 0.0
    rate = float(row[10]) if pd.notna(row[10]) else 10.0
    amount = float(row[11]) if pd.notna(row[11]) else (km * rate)
    advance = float(row[12]) if pd.notna(row[12]) and str(row[12]).strip() != '' else 0.0
    balance = amount - advance
    
    # Locations
    from_loc = "Englabs"
    to_loc = summary.replace("up & down", "").replace("up & Down", "").strip()
    
    summary_clean = summary.replace("up & down", "").replace("up & Down", "").strip()
    if "from" in summary_clean.lower() and "to" in summary_clean.lower():
        # Case insensitive split on "to" with flexible spacing
        import re
        parts = re.split(r'\s+to\s+|\sto\s|\sto|\sto\s', summary_clean, flags=re.IGNORECASE)
        if len(parts) >= 2:
            from_part = parts[0].strip()
            # Clean from prefix
            if from_part.lower().startswith("from "):
                from_loc = from_part[5:].strip()
            elif from_part.lower().startswith("from"):
                from_loc = from_part[4:].strip()
            else:
                from_loc = from_part
            
            # Reconstruct destination list
            dest_parts = [d.strip() for d in parts[1:] if d.strip()]
            to_loc = " -> ".join(dest_parts)
            
    # For display formatting
    if from_loc == "Englabs":
        from_loc = "Englabs"
    
    # Format time based on SR NO. or hardcoded standard
    time_str = "10:00 AM"
    timestamp = f"{date_str}T10:00:00Z"
    
    return {
        "id": trip_id,
        "timestamp": timestamp,
        "date": date_str,
        "time": time_str,
        "porterName": "Gurpreet Singh",
        "vehicleNumber": "CH01AB5781",
        "customerName": under_work,
        "customerMobile": "918894825152",
        "fromLocation": from_loc,
        "toLocation": to_loc,
        "deliveryAddress": to_loc,
        "materialDescription": reason,
        "distanceKm": int(km),
        "ratePerKm": int(rate),
        "grossAmount": amount,
        "advanceAmount": advance,
        "remainingBalance": balance,
        "totalAmount": amount,
        "paymentStatus": "COMPLETED",
        "deliveryStatus": "DELIVERED",
        "timeline": [
            {
                "status": "ACCEPTED",
                "timestamp": f"{date_str}T09:30:00Z",
                "remarks": "Mission Initialized"
            },
            {
                "status": "DELIVERED",
                "timestamp": f"{date_str}T12:00:00Z",
                "remarks": "Completed"
            }
        ]
    }

# Update PTR-2026-0020
row_20 = parse_row(14, "PTR-2026-0020")
for trip in trips:
    if trip['id'] == "PTR-2026-0020":
        trip['advanceAmount'] = row_20['advanceAmount']
        trip['remainingBalance'] = row_20['remainingBalance']
        trip['grossAmount'] = row_20['grossAmount']
        trip['totalAmount'] = row_20['totalAmount']
        trip['distanceKm'] = row_20['distanceKm']
        trip['ratePerKm'] = row_20['ratePerKm']
        trip['materialDescription'] = row_20['materialDescription']
        trip['customerName'] = row_20['customerName']
        trip['fromLocation'] = row_20['fromLocation']
        trip['toLocation'] = row_20['toLocation']
        trip['deliveryAddress'] = row_20['deliveryAddress']

# Update PTR-2026-0021
row_21 = parse_row(15, "PTR-2026-0021")
for trip in trips:
    if trip['id'] == "PTR-2026-0021":
        trip['advanceAmount'] = row_21['advanceAmount']
        trip['remainingBalance'] = row_21['remainingBalance']
        trip['grossAmount'] = row_21['grossAmount']
        trip['totalAmount'] = row_21['totalAmount']
        trip['distanceKm'] = row_21['distanceKm']
        trip['ratePerKm'] = row_21['ratePerKm']
        trip['materialDescription'] = row_21['materialDescription']
        trip['customerName'] = row_21['customerName']
        trip['fromLocation'] = row_21['fromLocation']
        trip['toLocation'] = row_21['toLocation']
        trip['deliveryAddress'] = row_21['deliveryAddress']

# Append PTR-2026-0022
trip_ids = [t['id'] for t in trips]
if "PTR-2026-0022" not in trip_ids:
    trips.append(parse_row(16, "PTR-2026-0022"))
else:
    # Update it if already exists
    row_22 = parse_row(16, "PTR-2026-0022")
    for trip in trips:
        if trip['id'] == "PTR-2026-0022":
            trip.update(row_22)

# Append PTR-2026-0023
if "PTR-2026-0023" not in trip_ids:
    trips.append(parse_row(17, "PTR-2026-0023"))
else:
    row_23 = parse_row(17, "PTR-2026-0023")
    for trip in trips:
        if trip['id'] == "PTR-2026-0023":
            trip.update(row_23)

# Append PTR-2026-0024
if "PTR-2026-0024" not in trip_ids:
    trips.append(parse_row(18, "PTR-2026-0024"))
else:
    row_24 = parse_row(18, "PTR-2026-0024")
    for trip in trips:
        if trip['id'] == "PTR-2026-0024":
            trip.update(row_24)

# Write back
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(trips, f, indent=4)

print("Successfully updated porter_missions_forensic.json")
