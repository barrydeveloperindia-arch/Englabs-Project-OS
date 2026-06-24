import os
import json
import shutil
import re

# Base paths
G_DRIVE_BASE = r"G:\HR Team Managements\Englabs Projects APK\Projects"
DATA_DIR = "./data"
SCRATCH_DIR = "./scratch"

# Main folder names requested by user (including duplicates for exact spelling compatibility)
TARGET_FOLDERS = {
    "Vendor PO": os.path.join(G_DRIVE_BASE, "Vendor PO"),
    "Client PO": os.path.join(G_DRIVE_BASE, "Client PO"),
    "Clients Quote": os.path.join(G_DRIVE_BASE, "Clients Quote"),
    "Vendor Quote": os.path.join(G_DRIVE_BASE, "Vendor Quote")
}

def clean_ref(ref):
    if not ref:
        return ""
    # Strip extensions and extract digits/alphanumeric parts
    ref = str(ref).strip()
    return ref

def main():
    print("Creating main category folders...")
    for name, path in TARGET_FOLDERS.items():
        os.makedirs(path, exist_ok=True)
        print(f"Verified folder: {path}")

    # Read project IDs from data/
    print("\nReading active project databases...")
    project_files = [f for f in os.listdir(DATA_DIR) if f.startswith('C') and f.endswith('.json')]
    projects = []
    
    for filename in project_files:
        p_id = filename.replace('.json', '')
        file_path = os.path.join(DATA_DIR, filename)
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            project_info = {
                "id": p_id,
                "digits": re.findall(r'\d+', p_id)[0],
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
        
    print(f"Loaded {len(projects)} projects.")

    # Create project-wise subfolders in each category
    print("\nCreating project-wise subfolders...")
    for p in projects:
        for name, base_path in TARGET_FOLDERS.items():
            proj_folder = os.path.join(base_path, p["id"])
            os.makedirs(proj_folder, exist_ok=True)

    print("Project subfolders created successfully.")

    # Scan and organize files from scratch/
    print("\nScanning scratch/ folder for matching files...")
    if not os.path.exists(SCRATCH_DIR):
        print(f"Scratch directory {SCRATCH_DIR} not found.")
        return

    scratch_files = os.listdir(SCRATCH_DIR)
    copied_count = 0

    for file_name in scratch_files:
        file_path = os.path.join(SCRATCH_DIR, file_name)
        if os.path.isdir(file_path):
            continue

        file_upper = file_name.upper()

        # Find matching project by digits or PO/Quote reference strings
        matched_project = None
        matched_category = None  # "vendor_po", "client_po", "quote", "vendor_quote"

        for p in projects:
            # 1. Check direct digit match of the project ID
            if p["digits"] in file_name:
                matched_project = p["id"]
                # Default categorization based on filename patterns
                if "P2100" in file_upper or ("PO" in file_upper and "VEND" in file_upper):
                    matched_category = "vendor_po"
                elif "PO" in file_upper:
                    matched_category = "client_po"
                elif file_upper.startswith("EQ") or "CLIENT" in file_upper:
                    matched_category = "client_quote"
                elif "QT" in file_upper or "QUOTE" in file_upper or "QUOTATION" in file_upper:
                    matched_category = "vendor_quote"
                break

            # 2. Check vendor PO match
            vendor_po_match = False
            for v_po in p["vendor_pos"]:
                # Match suffix (e.g. 16835) or full name
                v_digits = "".join(re.findall(r'\d+', v_po))
                if len(v_digits) >= 4 and v_digits in file_name:
                    vendor_po_match = True
                    break
                if v_po in file_name:
                    vendor_po_match = True
                    break
            if vendor_po_match:
                matched_project = p["id"]
                matched_category = "vendor_po"
                break

            # 3. Check client PO match
            client_po_match = False
            for c_po in p["client_pos"]:
                c_digits = "".join(re.findall(r'\d+', c_po))
                if len(c_digits) >= 4 and c_digits in file_name:
                    client_po_match = True
                    break
                if c_po in file_name:
                    client_po_match = True
                    break
            if client_po_match:
                matched_project = p["id"]
                matched_category = "client_po"
                break

            # 4. Check Quote match
            quote_match = False
            for q in p["quotes"]:
                q_digits = "".join(re.findall(r'\d+', q))
                if len(q_digits) >= 4 and q_digits in file_name:
                    quote_match = True
                    break
                if q in file_name:
                    quote_match = True
                    break
            if quote_match:
                matched_project = p["id"]
                matched_category = "client_quote"
                break

        if not matched_project or not matched_category:
            continue

        dest_dirs = []
        if matched_category == "vendor_po":
            dest_dirs.append(os.path.join(TARGET_FOLDERS["Vendor PO"], matched_project))
        elif matched_category == "client_po":
            dest_dirs.append(os.path.join(TARGET_FOLDERS["Client PO"], matched_project))
        elif matched_category == "client_quote":
            dest_dirs.append(os.path.join(TARGET_FOLDERS["Clients Quote"], matched_project))
        elif matched_category == "vendor_quote":
            dest_dirs.append(os.path.join(TARGET_FOLDERS["Vendor Quote"], matched_project))

        # Copy file to all matching destination folders
        for dest_dir in dest_dirs:
            dest_file_path = os.path.join(dest_dir, file_name)
            try:
                shutil.copy2(file_path, dest_file_path)
                print(f"Copied: {file_name} -> {dest_file_path} (Category: {matched_category})")
                copied_count += 1
            except Exception as e:
                print(f"Error copying {file_name}: {e}")

    print(f"\nCompleted! Copied {copied_count} files into categorized folders.")

if __name__ == "__main__":
    main()
