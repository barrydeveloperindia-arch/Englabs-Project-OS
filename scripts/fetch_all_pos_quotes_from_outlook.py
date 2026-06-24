import win32com.client
import os
import sys
import json
import re
import shutil

sys.stdout.reconfigure(encoding='utf-8')

# Base paths
G_DRIVE_BASE = r"G:\HR Team Managements\Englabs Projects APK\Projects"
DATA_DIR = "./data"
SCRATCH_DIR = "./scratch"

# Main folder paths
TARGET_FOLDERS = {
    "Vendor PO": os.path.join(G_DRIVE_BASE, "Vendor PO"),
    "Client PO": os.path.join(G_DRIVE_BASE, "Client PO"),
    "Clients Quote": os.path.join(G_DRIVE_BASE, "Clients Quote"),
    "Vendor Quote": os.path.join(G_DRIVE_BASE, "Vendor Quote")
}

def clean_ref(ref):
    if not ref:
        return ""
    return str(ref).strip()

def main():
    print("Reading active project databases...")
    project_files = [f for f in os.listdir(DATA_DIR) if f.startswith('C') and f.endswith('.json')]
    projects = []
    
    # Store all numeric digits for fast lookup
    search_digits_map = {} # maps digits -> project_id
    
    for filename in project_files:
        p_id = filename.replace('.json', '')
        file_path = os.path.join(DATA_DIR, filename)
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            p_digits = re.findall(r'\d+', p_id)[0]
            search_digits_map[p_digits] = p_id
            
            project_info = {
                "id": p_id,
                "digits": p_digits,
                "vendor_pos": [],
                "client_pos": [],
                "quotes": []
            }
            
            # Extract Vendor PO references
            po_rel = data.get("poRelease", {})
            if po_rel.get("poVendorSent"):
                project_info["vendor_pos"].append(clean_ref(po_rel["poVendorSent"]))
            fin = data.get("financials", {})
            if fin.get("poNumber"):
                project_info["vendor_pos"].append(clean_ref(fin["poNumber"]))
                
            # Extract Client PO references
            plan = data.get("planning", {})
            if plan.get("poNumber"):
                project_info["client_pos"].append(clean_ref(plan["poNumber"]))
                
            # Extract Quote/Invoice references
            inv_rel = data.get("invoiceRelease", {})
            if inv_rel.get("invoiceNumber"):
                project_info["quotes"].append(clean_ref(inv_rel["invoiceNumber"]))
                
            projects.append(project_info)
        except Exception as e:
            print(f"Error reading {filename}: {e}")
            
    print(f"Loaded {len(projects)} active projects.")
    
    # Initialize Outlook COM
    print("Connecting to local Outlook Application...")
    try:
        outlook = win32com.client.Dispatch("Outlook.Application")
        ns = outlook.GetNamespace("MAPI")
    except Exception as e:
        print(f"Failed to connect to Outlook: {e}")
        return

    print("Scan starting...")
    saved_count = 0
    
    def search_folders(folder):
        nonlocal saved_count
        try:
            items = folder.Items
            items.Sort("[ReceivedTime]", True)
            
            # Restrict to emails from the last 90 days to ensure performance and capture recent POs/Quotes
            restricted = items.Restrict("[ReceivedTime] >= '03/01/2026 12:00 AM'")
            
            for m in restricted:
                try:
                    subject = str(m.Subject)
                    sender = str(m.SenderName)
                    received = str(m.ReceivedTime)
                    body = str(m.Body)
                    
                    subject_lower = subject.lower()
                    body_lower = body.lower()
                    
                    # 1. Check direct digit match of the project IDs
                    matched_pids = set()
                    for digits, pid in search_digits_map.items():
                        # We want to match digits separated by word boundaries, e.g. "5254" or "C5254" or "EQ5254"
                        if digits in subject_lower or digits in body_lower:
                            matched_pids.add(pid)
                            
                    # 2. Check attachments count
                    if m.Attachments.Count > 0:
                        for i in range(1, m.Attachments.Count + 1):
                            fname = m.Attachments.Item(i).FileName
                            fname_lower = fname.lower()
                            
                            # Also check attachments for project digits
                            for digits, pid in search_digits_map.items():
                                if digits in fname_lower:
                                    matched_pids.add(pid)

                    if not matched_pids:
                        continue
                        
                    # Process matching email
                    for pid in matched_pids:
                        p_digits = re.findall(r'\d+', pid)[0]
                        p_info = next((proj for proj in projects if proj["id"] == pid), None)
                        
                        # Process attachments
                        if m.Attachments.Count > 0:
                            for i in range(1, m.Attachments.Count + 1):
                                att = m.Attachments.Item(i)
                                fname = att.FileName
                                fname_upper = fname.upper()
                                
                                # Skip non-document file types
                                if not any(ext in fname_upper for ext in [".PDF", ".XLSX", ".XLS", ".DOCX", ".DOC", ".JPG", ".PNG"]):
                                    continue
                                    
                                # Match attachment to project: it must contain the project digits or match standard references
                                is_match = False
                                matched_category = None
                                
                                # Match by digits
                                if p_digits in fname:
                                    is_match = True
                                    if "P2100" in fname_upper or ("PO" in fname_upper and "VEND" in fname_upper):
                                        matched_category = "vendor_po"
                                    elif "PO" in fname_upper:
                                        matched_category = "client_po"
                                    elif fname_upper.startswith("EQ") or "CLIENT" in fname_upper:
                                        matched_category = "client_quote"
                                    elif "QT" in fname_upper or "QUOTE" in fname_upper or "QUOTATION" in fname_upper:
                                        matched_category = "vendor_quote"
                                    else:
                                        matched_category = "vendor_po" # default fallback
                                        
                                # Match by custom DB references
                                if not is_match and p_info:
                                    # Vendor PO match
                                    for v_po in p_info["vendor_pos"]:
                                        v_digits = "".join(re.findall(r'\d+', v_po))
                                        if (len(v_digits) >= 4 and v_digits in fname) or (v_po in fname):
                                            is_match = True
                                            matched_category = "vendor_po"
                                            break
                                    # Client PO match
                                    if not is_match:
                                        for c_po in p_info["client_pos"]:
                                            c_digits = "".join(re.findall(r'\d+', c_po))
                                            if (len(c_digits) >= 4 and c_digits in fname) or (c_po in fname):
                                                is_match = True
                                                matched_category = "client_po"
                                                break
                                    # Quote match
                                    if not is_match:
                                        for q in p_info["quotes"]:
                                            q_digits = "".join(re.findall(r'\d+', q))
                                            if (len(q_digits) >= 4 and q_digits in fname) or (q in fname):
                                                is_match = True
                                                matched_category = "client_quote"
                                                break
                                                
                                if is_match and matched_category:
                                    # Save to scratch folder first for backup
                                    scratch_save_path = os.path.join(SCRATCH_DIR, fname)
                                    att.SaveAsFile(scratch_save_path)
                                    
                                    # Copy to categorized folder
                                    dest_dirs = []
                                    if matched_category == "vendor_po":
                                        dest_dirs.append(os.path.join(TARGET_FOLDERS["Vendor PO"], pid))
                                    elif matched_category == "client_po":
                                        dest_dirs.append(os.path.join(TARGET_FOLDERS["Client PO"], pid))
                                    elif matched_category == "client_quote":
                                        dest_dirs.append(os.path.join(TARGET_FOLDERS["Clients Quote"], pid))
                                    elif matched_category == "vendor_quote":
                                        dest_dirs.append(os.path.join(TARGET_FOLDERS["Vendor Quote"], pid))
                                        
                                    for dest_dir in dest_dirs:
                                        os.makedirs(dest_dir, exist_ok=True)
                                        dest_file_path = os.path.join(dest_dir, fname)
                                        shutil.copy2(scratch_save_path, dest_file_path)
                                        print(f"Outlook Match found: Email from {sender} on {received} for project {pid}")
                                        print(f"Saved: {fname} -> {dest_file_path}")
                                        saved_count += 1
                                        
                except Exception as item_e:
                    pass
        except Exception as e:
            pass

        try:
            for sub in folder.Folders:
                search_folders(sub)
        except:
            pass

    for store in ns.Stores:
        # Scan Inbox and custom project folders
        print(f"Scanning store: {store.DisplayName}")
        try:
            root = store.GetRootFolder()
            search_folders(root)
        except Exception as e:
            print(f"Error scanning store root: {e}")

    print(f"\nOutlook Fetch Completed. Saved {saved_count} documents to categorized folders.")

if __name__ == "__main__":
    main()
