import json
import datetime
import os
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

# Configure this path to point to your Firebase Admin SDK service account key
SERVICE_ACCOUNT_PATH = 'firebase_admin_sdk_key.json'

def backup_firestore():
    print(f"Starting Firestore Backup: {datetime.datetime.now()}")
    
    if not os.path.exists(SERVICE_ACCOUNT_PATH):
        print(f"ERROR: Service account key not found at {SERVICE_ACCOUNT_PATH}")
        print("Please download it from Firebase Console -> Project Settings -> Service Accounts")
        return

    try:
        cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        
        collections = ['users', 'projects', 'gate_entries', 'porter_entries', 'activity_logs']
        backup_data = {}
        
        for coll_name in collections:
            print(f"Exporting collection: {coll_name}...")
            docs = db.collection(coll_name).stream()
            coll_data = {}
            for doc in docs:
                coll_data[doc.id] = doc.to_dict()
            backup_data[coll_name] = coll_data
            print(f"  -> Exported {len(coll_data)} documents.")
            
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"firestore_backup_{timestamp}.json"
        backup_dir = "backups"
        
        if not os.path.exists(backup_dir):
            os.makedirs(backup_dir)
            
        filepath = os.path.join(backup_dir, backup_filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, indent=4, default=str)
            
        print(f"Backup successfully saved to {filepath}")
        
    except Exception as e:
        print(f"Backup failed: {e}")

if __name__ == "__main__":
    backup_firestore()
