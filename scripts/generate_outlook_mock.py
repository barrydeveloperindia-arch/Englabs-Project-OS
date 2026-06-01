import json
import re
import os
import pandas as pd

site_cash_file = r"G:\Englabs_HR Team Managements\Site Cash Details\Englabs Site Cash.xlsx"
outlook_db_file = r"c:\Users\SAM\Documents\Antigravity\Englabs Projects\data\outlook_processed_db.json"

df_site = pd.read_excel(site_cash_file, sheet_name='Projects wise Details_2026', header=1)
# Clean customer name to get client mapping
project_ids = df_site['Current Projects Detasils (Project ID)'].dropna().tolist()

# Default contacts and addresses for mock database
contacts = [
    ("Bobby Kumar", "9056333249", "bobby@client.com"),
    ("Sanjiv Sharma", "9812345678", "sanjiv@client.com"),
    ("Harish Kumar", "9417855421", "harish@client.com"),
    ("Raman Singh", "9876543210", "raman@client.com"),
    ("Ankush Kumar", "9815573934", "ankush@client.com"),
    ("Kartik Jangra", "9012345678", "kartik@client.com"),
    ("Vijay Sharma", "9801234567", "vijay@client.com")
]

cities = [
    ("Mohali", "Punjab", "Industrial Area Phase 9"),
    ("Panchkula", "Haryana", "MDC Sector 4"),
    ("Chandigarh", "UT", "IT Park Road"),
    ("Hoshiarpur", "Punjab", "Industrial Area Sector 3"),
    ("Baddi", "Himachal Pradesh", "Industrial Area Phase 1"),
    ("Ludhiana", "Punjab", "Focal Point Phase 5")
]

# We will read what we already solved in the Excel file
# and create communications for them
wb = pd.read_excel(site_cash_file, sheet_name='Projects wise Details_2026', header=1)
records = []

# Keep the two original steel/IoT logs
records.append({
    "id": "MSG-001",
    "date": "2026-05-19T09:30:00Z",
    "subject": "Re: Quotation Approval for Steel Plant Automation",
    "client": "Tata Steel",
    "projectCode": "TATA-001",
    "projectName": "Steel Plant Expansion Phase II",
    "snippet": "Please find attached the revised quotation QT-2026-051. We have adjusted the timelines as discussed...",
    "type": "QUOTATION",
    "status": "CLOSED",
    "hasAttachments": False,
    "email": "contact@tatasteel.com",
    "contactPerson": "Ramanujan",
    "mobileNumber": "9812345670",
    "address": "Tata Steel Office, Jamshedpur, Jharkhand",
    "city": "Jamshedpur",
    "state": "Jharkhand"
})

records.append({
    "id": "MSG-002",
    "date": "2026-05-18T14:15:00Z",
    "subject": "Invoice INV-8821 - Pending Payment Reminder",
    "client": "Reliance Industries",
    "projectCode": "REL-405",
    "projectName": "Refinery IoT Sensors",
    "snippet": "This is a gentle reminder regarding the outstanding payment for invoice INV-8821. Kindly process...",
    "type": "INVOICE",
    "status": "CLOSED",
    "hasAttachments": False,
    "referenceNo": "INV-8821",
    "email": "accounts@reliance.com",
    "contactPerson": "Mr. Ambani",
    "mobileNumber": "9876543201",
    "address": "Reliance Corporate Park, Ghansoli, Navi Mumbai",
    "city": "Navi Mumbai",
    "state": "Maharashtra"
})

idx = 3
for _, row in wb.iterrows():
    p_id = str(row.get('Current Projects Detasils (Project ID)', '')).strip()
    cust_name = str(row.get('Customer Name ', '')).strip()
    
    if not p_id or p_id == 'nan' or p_id == 'TOTAL' or p_id == 'Current Projects Detasils (Project ID)':
        continue
        
    # fallback client name
    client_name = cust_name if cust_name and cust_name != 'nan' and cust_name != 'None' else "SOMAFUSION WELLNESS LLP"
    
    # Assign contact and location deterministically based on row index or name
    c_idx = idx % len(contacts)
    l_idx = idx % len(cities)
    
    contact_name, phone, base_email = contacts[c_idx]
    email = base_email.replace("client", client_name.lower().replace(" ", "").replace(".", ""))
    city, state, area = cities[l_idx]
    address = f"Plot {10 + idx}, {area}, {city}, {state}"
    
    # Mapped EQ No
    digits = re.search(r'\d+', p_id).group(0)
    eq_no = f"EQ{digits}-L40-QT-1{digits}"
    
    date_str = f"2026-05-{10 + (idx % 12):02d}T10:00:00Z"
    
    records.append({
        "id": f"MSG-{digits}",
        "date": date_str,
        "subject": f"Project {eq_no} - Order Confirmation and Site Details",
        "client": client_name,
        "projectCode": p_id,
        "projectName": f"{client_name} Project",
        "snippet": f"Confirming the project details. Site location: {city}. Contact person: {contact_name}, Mobile: {phone}, Email: {email}. Delivery Address: {address}",
        "type": "COMMUNICATION",
        "status": "APPROVED",
        "hasAttachments": True,
        "referenceNo": eq_no,
        "email": email,
        "contactPerson": contact_name,
        "mobileNumber": phone,
        "address": address,
        "city": city,
        "state": state
    })
    idx += 1

with open(outlook_db_file, 'w', encoding='utf-8') as f:
    json.dump(records, f, indent=4, ensure_ascii=False)
    
print(f"Generated {len(records)} records in outlook_processed_db.json")
