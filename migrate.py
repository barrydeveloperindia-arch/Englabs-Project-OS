import json
import os
import glob

# Paths
patty_cash_path = r'C:\Users\SAM\Documents\Antigravity\Englabs Projects\src\data\patty_cash.json'
project_data_dir = r'C:\Users\SAM\Documents\Antigravity\Englabs Projects\data'

with open(patty_cash_path, 'r') as f:
    patty_cash_data = json.load(f)

# Map patty cash data by ProjectId
patty_cash_dict = {str(item.get('ProjectId')).strip(): item for item in patty_cash_data if item.get('ProjectId')}

updated_count = 0
project_files = glob.glob(os.path.join(project_data_dir, '*.json'))

for pfile in project_files:
    filename = os.path.basename(pfile)
    project_id = filename.replace('.json', '')
    
    if project_id in patty_cash_dict:
        # Load the project JSON
        with open(pfile, 'r', encoding='utf-8') as f:
            try:
                project_data = json.load(f)
            except Exception as e:
                print(f"Error parsing {filename}: {e}")
                continue
                
        # Inject the financials object
        pc = patty_cash_dict[project_id]
        project_data['financials'] = {
            'vendorName': pc.get('VendorName'),
            'vendorLocation': pc.get('VendorLocation'),
            'dispatchBudget': pc.get('BudgetDispatch'),
            'totalCost': pc.get('TotalCost'),
            'profitLoss': pc.get('ProfitLoss'),
            'deliveryFeeMode': pc.get('DeliveryFeeMode'),
            'poNumber': pc.get('PONumber')
        }
        
        # Write it back safely
        with open(pfile, 'w', encoding='utf-8') as f:
            json.dump(project_data, f, indent=4)
            
        updated_count += 1

print(f"Migration completed. Successfully updated {updated_count} project files.")
