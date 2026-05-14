import pdfplumber
import json
import sys
import os

def extract_stock_data(pdf_path):
    if not os.path.exists(pdf_path):
        print(f"Error: File {pdf_path} not found")
        return None

    stock_data = {
        "report_date": "",
        "items": []
    }

    try:
        with pdfplumber.open(pdf_path) as pdf:
            # Try to get date from first page text
            first_page_text = pdf.pages[0].extract_text()
            # Basic date detection logic (simplified for this context)
            if "Date:" in first_page_text:
                stock_data["report_date"] = first_page_text.split("Date:")[1].split("\n")[0].strip()

            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        # Filter out header rows or empty rows
                        if not row or "Item" in row[0] or "Name" in row[0]:
                            continue
                        
                        # Assuming a standard 6-column layout: Name, Code, Category, Current, Unit, Location
                        # Adjusting based on common Englabs report structures
                        try:
                            if len(row) >= 4:
                                item = {
                                    "name": row[0].strip() if row[0] else "Unknown",
                                    "code": row[1].strip() if row[1] else "N/A",
                                    "category": row[2].strip() if len(row) > 2 and row[2] else "General",
                                    "current_stock": float(row[3].replace(',', '')) if len(row) > 3 and row[3] and row[3].replace('.', '').replace(',', '').isdigit() else 0,
                                    "unit": row[4].strip() if len(row) > 4 and row[4] else "Nos",
                                    "location": row[5].strip() if len(row) > 5 and row[5] else "Rack-01"
                                }
                                stock_data["items"].append(item)
                        except Exception as e:
                            # Skip rows that don't match the expected numeric format for stock
                            continue
    except Exception as e:
        print(f"Extraction Error: {str(e)}")
        return None

    return stock_data

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python extract_stock.py <pdf_path>")
    else:
        result = extract_stock_data(sys.argv[1])
        if result:
            print(json.dumps(result, indent=2))
