"""
generate_staff_letters_pdf.py
Generates Appointment + Joining Letter PDFs for Gurpreet Singh
using the updated .md source files (May 14, 2026 joining date).

Requirements:
  pip install markdown weasyprint

Usage:
  python scripts/generate_staff_letters_pdf.py
"""

import os, sys, textwrap

LETTERS_DIR = r"G:\HR Team Managements\Englabs Projects APK\Porter Team\Porter Staff\Letters"
LETTERHEAD_DIR = r"G:\Englabs Office Record\ENGLABS_INDIIA_PVT_LTD\14_Letter_Head_Englabs"

APPOINTMENT_MD  = os.path.join(LETTERS_DIR, "Appointment_Letter_Gurpreet_Singh.md")
APPOINTMENT_PDF = os.path.join(LETTERS_DIR, "Appointment_Letter_Gurpreet_Singh.pdf")
JOINING_MD      = os.path.join(LETTERS_DIR, "Joining_Letter_Gurpreet_Singh.md")
JOINING_PDF     = os.path.join(LETTERS_DIR, "Joining_Letter_Gurpreet_Singh.pdf")

CSS = """
@page {
    size: A4;
    margin: 28mm 22mm 28mm 22mm;
}
body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 10.5pt;
    color: #1e293b;
    line-height: 1.7;
}
h1 {
    font-size: 16pt;
    color: #0e4368;
    margin-bottom: 2px;
    letter-spacing: -0.3px;
}
h3, h4 {
    color: #0e4368;
    margin-top: 14px;
    margin-bottom: 4px;
}
strong { color: #0f172a; }
hr {
    border: none;
    border-top: 2px solid #e2e8f0;
    margin: 14px 0;
}
ul, ol { padding-left: 18px; margin: 8px 0; }
li { margin-bottom: 4px; }
p { margin: 6px 0; }
"""

def md_to_pdf(md_path, pdf_path):
    try:
        import markdown
        from weasyprint import HTML, CSS as WCSS
    except ImportError:
        print("ERROR: Missing libraries. Run: pip install markdown weasyprint")
        sys.exit(1)

    with open(md_path, 'r', encoding='utf-8') as f:
        md_text = f.read()

    html_body = markdown.markdown(md_text, extensions=['tables', 'nl2br'])
    full_html = f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body>{html_body}</body>
</html>"""

    HTML(string=full_html).write_pdf(
        pdf_path,
        stylesheets=[WCSS(string=CSS)]
    )
    print("  [OK]  Generated: " + pdf_path)


if __name__ == "__main__":
    print("\nEnglabs Letter PDF Generator")
    print("="*44)
    print(f"  Source dir : {LETTERS_DIR}")
    print()

    print("Generating Appointment Letter PDF...")
    md_to_pdf(APPOINTMENT_MD, APPOINTMENT_PDF)

    print("Generating Joining Report PDF...")
    md_to_pdf(JOINING_MD, JOINING_PDF)

    print("\n[DONE] Both PDFs updated with Joining Date: May 14, 2026")
