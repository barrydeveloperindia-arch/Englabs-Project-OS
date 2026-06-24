import json
import pandas as pd
import math
import os
import re

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

# We know SR 1 starts at index 9 in df (row 10 in excel)
# We will loop through df starting from index 9
# Keep going as long as Col 4 (SR. NO.) is a valid integer

def parse_row(row, trip_id):
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
    
    # Check if row[12] is valid number
    try:
        val_12 = str(row[12]).strip()
        if pd.notna(row[12]) and val_12 != '' and val_12 != 'nan':
            advance = float(row[12])
        else:
            advance = 0.0
    except:
        advance = 0.0
        
    balance = amount - advance
    
    # Locations
    from_loc = "Englabs"
    to_loc = summary.replace("up & down", "").replace("up & Down", "").strip()
    
    summary_clean = summary.replace("up & down", "").replace("up & Down", "").strip()
    if "from" in summary_clean.lower() and "to" in summary_clean.lower():
        parts = re.split(r'\s+to\s+|\sto\s|\sto|\sto\s', summary_clean, flags=re.IGNORECASE)
        if len(parts) >= 2:
            from_part = parts[0].strip()
            if from_part.lower().startswith("from "):
                from_loc = from_part[5:].strip()
            elif from_part.lower().startswith("from"):
                from_loc = from_part[4:].strip()
            else:
                from_loc = from_part
            
            dest_parts = [d.strip() for d in parts[1:] if d.strip()]
            to_loc = " -> ".join(dest_parts)
            
    time_str = "10:00 AM"
    timestamp = f"{date_str}T10:00:00Z" if date_str else None
    
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
        "paymentStatus": "COMPLETED" if balance <= 0 else "PARTIAL",
        "deliveryStatus": "DELIVERED",
        "timeline": [
            {
                "status": "ACCEPTED",
                "timestamp": f"{date_str}T09:30:00Z" if date_str else None,
                "remarks": "Mission Initialized"
            },
            {
                "status": "DELIVERED",
                "timestamp": f"{date_str}T12:00:00Z" if date_str else None,
                "remarks": "Completed"
            }
        ]
    }

# Map existing IDs in trips
trip_map = {t['id']: t for t in trips}

for idx in range(9, len(df)):
    row = df.iloc[idx]
    sr_no_val = row[4]
    if pd.isna(sr_no_val):
        continue
    
    try:
        sr_no = int(float(sr_no_val))
    except ValueError:
        continue
        
    # Check if date is empty or travel summary is empty
    date_val = row[5]
    summary_val = row[6]
    if pd.isna(date_val) or pd.isna(summary_val) or str(date_val).strip() == '' or str(summary_val).strip() == '':
        continue
        
    trip_id = f"PTR-2026-{(14 + sr_no):04d}"
    parsed_trip = parse_row(row, trip_id)
    
    if trip_id in trip_map:
        orig = trip_map[trip_id]
        orig.update({
            "timestamp": parsed_trip["timestamp"] or orig.get("timestamp"),
            "date": parsed_trip["date"] or orig.get("date"),
            "customerName": parsed_trip["customerName"] or orig.get("customerName"),
            "fromLocation": parsed_trip["fromLocation"] or orig.get("fromLocation"),
            "toLocation": parsed_trip["toLocation"] or orig.get("toLocation"),
            "deliveryAddress": parsed_trip["deliveryAddress"] or orig.get("deliveryAddress"),
            "materialDescription": parsed_trip["materialDescription"] or orig.get("materialDescription"),
            "distanceKm": parsed_trip["distanceKm"],
            "ratePerKm": parsed_trip["ratePerKm"],
            "grossAmount": parsed_trip["grossAmount"],
            "advanceAmount": parsed_trip["advanceAmount"],
            "remainingBalance": parsed_trip["remainingBalance"],
            "totalAmount": parsed_trip["totalAmount"]
        })
        print(f"Updated {trip_id}: {parsed_trip['date']}, {parsed_trip['fromLocation']} -> {parsed_trip['toLocation']}")
    else:
        trips.append(parsed_trip)
        trip_map[trip_id] = parsed_trip
        print(f"Added {trip_id}: {parsed_trip['date']}, {parsed_trip['fromLocation']} -> {parsed_trip['toLocation']}")

# Write back
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(trips, f, indent=4)

print("Successfully updated porter_missions_forensic.json")
