import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export class ExportManager {
    /**
     * Exports a JSON array to an Excel (.xlsx) file.
     * @param data Array of objects representing the rows.
     * @param filename Desired filename without extension.
     */
    static exportToExcel(data: any[], filename: string) {
        if (!data || data.length === 0) {
            console.warn("No data to export.");
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

        XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    /**
     * Captures a DOM element and exports it as a PDF (.pdf) file.
     * @param elementId The ID of the DOM element to capture.
     * @param filename Desired filename without extension.
     */
    static async exportToPDF(elementId: string, filename: string) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.error(`Element with id ${elementId} not found.`);
            return;
        }

        try {
            // Temporarily adjust styling if needed to capture full height
            const canvas = await html2canvas(element, {
                scale: 2, // Higher resolution
                useCORS: true,
                logging: false,
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight
            });

            const imgData = canvas.toDataURL('image/png');
            
            // A4 size: 210 x 297 mm
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error("PDF generation failed:", error);
        }
    }
}
