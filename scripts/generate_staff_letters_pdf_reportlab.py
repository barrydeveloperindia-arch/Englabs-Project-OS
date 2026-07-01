import os
import sys
import re
import copy
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas

LETTERS_DIR = r"G:\HR Team Managements\Englabs Projects APK\Porter Team\Porter Staff\Letters"
LETTERHEAD_PDF = r"G:\Englabs Office Record\ENGLABS_INDIIA_PVT_LTD\14_Letter_Head_Englabs\Englabs Letter Head.pdf"

APPOINTMENT_MD  = os.path.join(LETTERS_DIR, "Appointment_Letter_Gurpreet_Singh.md")
APPOINTMENT_PDF = os.path.join(LETTERS_DIR, "Appointment_Letter_Gurpreet_Singh.pdf")
JOINING_MD      = os.path.join(LETTERS_DIR, "Joining_Letter_Gurpreet_Singh.md")
JOINING_PDF     = os.path.join(LETTERS_DIR, "Joining_Letter_Gurpreet_Singh.pdf")

class PageNumCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.pages = []

    def showPage(self):
        self.pages.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        page_count = len(self.pages)
        for page in self.pages:
            self.__dict__.update(page)
            self.draw_page_number(page_count)
            super().showPage()
        super().save()

    def draw_page_number(self, page_count):
        page_num = self._pageNumber
        print(f"Canvas drawing page number: Page {page_num} of {page_count}")
        self.saveState()
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#475569"))
        # Move page numbers to top-right, clearing the logo area
        self.drawRightString(558, 760, f"Page {page_num} of {page_count}")
        self.restoreState()

def generate_mask_pdf(mask_path, y, height):
    from reportlab.pdfgen import canvas as pdf_canvas
    c = pdf_canvas.Canvas(mask_path, pagesize=letter)
    c.setFillColor(colors.white)
    c.setStrokeColor(colors.white)
    c.rect(0, y, 612, height, fill=1, stroke=0)
    c.showPage()
    c.save()

def md_to_pdf_reportlab(md_path, pdf_path, hide_signature_always=False):
    print(f"Reading {md_path}...")
    if not os.path.exists(md_path):
        print(f"ERROR: File not found: {md_path}")
        return

    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    temp_pdf = pdf_path.replace(".pdf", "_content.pdf")
    
    # We increase margins:
    # - topMargin=150 to completely clear the logo on all pages
    # - bottomMargin=95 to completely clear the footer address block on all pages
    doc = SimpleDocTemplate(
        temp_pdf,
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=150,   # Increased from 108 to 150 to clear top letterhead logo & header
        bottomMargin=95  # Increased from 80 to 95 to clear bottom office address & page numbers
    )
    
    styles = getSampleStyleSheet()
    
    # Define custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#0e4368'),
        spaceAfter=12
    )
    
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10.5,
        leading=16,
        textColor=colors.HexColor('#1e293b'),
        spaceAfter=8
    )
    
    h3_style = ParagraphStyle(
        'DocH3',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#0e4368'),
        spaceBefore=14,
        spaceAfter=6
    )
    
    bullet_style = ParagraphStyle(
        'DocBullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10.5,
        leading=16,
        textColor=colors.HexColor('#1e293b'),
        leftIndent=20,
        firstLineIndent=-10,
        spaceAfter=6
    )

    story = []
    
    # Check if we should skip the header
    has_header = False
    if len(lines) > 0 and lines[0].strip().startswith('# ENGLABS INDIA PRIVATE LIMITED'):
        has_header = True
        
    skip_header = has_header
    header_lines_skipped = 0
    
    # Filter out corporate signature block to prevent duplication with the letterhead
    filtered_lines = []
    skip_sig = False
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("Yours sincerely,"):
            skip_sig = True
            continue
        if skip_sig:
            if stripped.upper().startswith("### ACCEPTANCE OF OFFER"):
                skip_sig = False
            else:
                continue
        filtered_lines.append(line)
        
    for line in filtered_lines:
        line = line.strip()
        
        if skip_header:
            if header_lines_skipped < 5:
                header_lines_skipped += 1
                continue
            else:
                skip_header = False
                
        if not line:
            story.append(Spacer(1, 6))
            continue
            
        # Parse markdown format:
        if line == '---':
            story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#e2e8f0'), spaceAfter=10, spaceBefore=10))
            continue
            
        if line.startswith('# '):
            text = line[2:]
            text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
            story.append(Paragraph(text, title_style))
            continue
            
        if line.startswith('### ') or line.startswith('#### '):
            text = line.lstrip('#').strip()
            # We let ReportLab handle page breaks naturally now, no forced PageBreak
            text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
            story.append(Paragraph(text, h3_style))
            continue
            
        if line.startswith('* ') or line.startswith('- '):
            text = line[2:]
            text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
            text = f"&bull; {text}"
            story.append(Paragraph(text, bullet_style))
            continue
            
        text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', line)
        text = text.replace('  ', '<br/>')
        story.append(Paragraph(text, body_style))
        
    doc.build(story, canvasmaker=PageNumCanvas)
    print(f"  Generated temporary content PDF: {temp_pdf}")
    
    # Merge with letterhead background PDF
    if os.path.exists(LETTERHEAD_PDF):
        # Generate the temporary mask PDF
        mask_temp_path = pdf_path.replace(".pdf", "_mask.pdf")
        # Mask covers y=85 to y=320 (height = 235) which hides the director signature and For M/s Englabs... text
        generate_mask_pdf(mask_temp_path, 85, 235)
        
        mask_reader = PdfReader(mask_temp_path)
        mask_page = mask_reader.pages[0]
        
        content_reader = PdfReader(temp_pdf)
        writer = PdfWriter()
        
        page_count = len(content_reader.pages)
        for i, page in enumerate(content_reader.pages):
            page_num = i + 1
            
            # Freshly read the letterhead PDF for each page to prevent shared state corruption
            bg_reader = PdfReader(LETTERHEAD_PDF)
            bg_page = bg_reader.pages[0]
            
            # Hide signature if requested globally, or if this is not the last page
            hide_sig = hide_signature_always or (page_num < page_count)
            
            if hide_sig:
                # Merge mask first
                bg_page.merge_page(mask_page)
                
            # Then merge the content page on top
            bg_page.merge_page(page)
            writer.add_page(bg_page)
            
        with open(pdf_path, "wb") as f:
            writer.write(f)
        print(f"  [OK] Generated Merged PDF: {pdf_path}")
        
        # Clean up temporary files
        for p in [temp_pdf, mask_temp_path]:
            if os.path.exists(p):
                try:
                    os.remove(p)
                except Exception as e:
                    print(f"  Warning: Could not remove {p}: {e}")
    else:
        # Fallback: rename temporary PDF to final path
        print(f"  [WARNING] Letterhead not found at {LETTERHEAD_PDF}. Using content PDF directly.")
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
        os.rename(temp_pdf, pdf_path)

if __name__ == '__main__':
    print("Generating PDFs with Official Letterhead background...")
    md_to_pdf_reportlab(APPOINTMENT_MD, APPOINTMENT_PDF, hide_signature_always=False)
    md_to_pdf_reportlab(JOINING_MD, JOINING_PDF, hide_signature_always=True)
    print("Done!")
