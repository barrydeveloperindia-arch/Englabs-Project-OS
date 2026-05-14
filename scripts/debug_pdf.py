import pdfplumber
with pdfplumber.open('G:/Englabs_HR Team Managements/Englabs Strore Stock Report/2026/May-2026/Englabs_Strore_Report_14-05-2026.pdf') as pdf:
    for i, page in enumerate(pdf.pages):
        print(f"--- PAGE {i} ---")
        print(page.extract_text())
        print(f"--- TABLES {i} ---")
        print(page.extract_tables())
