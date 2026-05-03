import pandas as pd
import os
import json
import re
from datetime import datetime

# Configuration
ONEDRIVE_PATH = r'C:\Users\SAM\OneDrive - Englabs India Pvt Ltd\2025 ENQUIRIES'
REGISTER_FILE = os.path.join(ONEDRIVE_PATH, 'ENQUIRIES REGISTER_SA UPDATED - 25-03.xlsx')
DATA_DIR = r'c:\Users\SAM\Documents\Antigravity\Englabs Projects\data'
PROJECTS_DIR = r'c:\Users\SAM\Documents\Antigravity\Englabs Projects\projects'

def clean_value(val):
    if pd.isna(val): return 0
    # Remove currency symbols and text
    val_str = str(val).replace('₹', '').replace(',', '').replace('+GST', '').strip()
    match = re.search(r'\d+', val_str)
    return int(match.group()) if match else 0

def ingest_enquiries():
    print(f"Starting OneDrive Ingestion from: {REGISTER_FILE}")
    
    if not os.path.exists(REGISTER_FILE):
        print(f"Error: Register file not found at {REGISTER_FILE}")
        return

    # Load Register
    try:
        df = pd.read_excel(REGISTER_FILE, sheet_name='MASTER LIST')
    except Exception as e:
        print(f"Error reading Excel: {e}")
        return

    # Filter for 2026 entries or those with "confirmation" / "production"
    # We'll look for potential "CXXX" projects
    confirmed_keywords = ['confirmation', 'production started', 'order received', 'ok', 'awating po']
    
    # Process rows
    new_projects_count = 0
    for index, row in df.iterrows():
        status = str(row.get('STATUS', '')).lower()
        eq_no = str(row.get('EQ NO', ''))
        client = str(row.get('DESCRIPTION', 'Unknown Client'))
        value = clean_value(row.get('VALUE', 0))
        date = row.get('DATE')

        # Criteria for "confirmed"
        is_confirmed = any(kw in status for kw in confirmed_keywords)
        
        if is_confirmed and eq_no:
            # Map EQ to C format (Internal mapping)
            # For now, let's use the EQ number as the basis for the C ID if no C ID exists
            # Example: EQ5189 -> C5189
            project_id = eq_no.split('-')[0].replace('EQ', 'C')
            
            # Skip if project ID doesn't follow CXXX pattern
            if not re.match(r'^C\d{3,4}$', project_id):
                continue

            target_file = os.path.join(DATA_DIR, f"{project_id}.json")
            
            # Check if we should update or create
            project_data = {
                "projectId": project_id,
                "client": client,
                "planning": {
                    "value": value,
                    "budget": int(value * 0.7), # Default 70% budget allocation
                    "deliveryTerms": "ToPay",
                    "poConfirmed": "awaiting po" not in status,
                    "startDate": str(date)[:10] if pd.notna(date) else str(datetime.now())[:10]
                },
                "production": {
                    "currentStage": "Engineering Design",
                    "stages": [
                        { "name": "Engineering Design", "status": "In Progress" if "confirmation" in status else "Pending" },
                        { "name": "Machine Processing", "status": "Pending" },
                        { "name": "Workshop Fabrication", "status": "In Progress" if "production" in status else "Pending" },
                        { "name": "Sanding", "status": "Pending" },
                        { "name": "Painting", "status": "Pending" },
                        { "name": "Drying", "status": "Pending" },
                        { "name": "Finishing", "status": "Pending" },
                        { "name": "Final Packaging", "status": "Pending" }
                    ]
                },
                "metrics": {
                    "totalComponents": 0,
                    "materialConsumption": "Tracking active...",
                    "workforce": ["TBD"]
                }
            }

            # Write to file
            with open(target_file, 'w', encoding='utf-8') as f:
                json.dump(project_data, f, indent=4)
            
            print(f"Synced: {project_id} - {client} (Value: {value})")
            new_projects_count += 1

    print(f"Ingestion Complete. {new_projects_count} projects synchronized.")

if __name__ == "__main__":
    ingest_enquiries()
