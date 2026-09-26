import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Exports any DOM element as a crisp, landscape retail invoice PDF
 * @param elementId The id of the DOM element to capture (e.g. 'printable-bill')
 * @param filename The downloaded file name (e.g. 'GLITCH-INVOICE-GL-00001.pdf')
 */
export async function exportElementToPdf(elementId: string, filename: string): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found for PDF generation`);
    return false;
  }

  try {
    // 1. Capture HTML element as high-DPI canvas
    const canvas = await html2canvas(element, {
      scale: 3, // 3x resolution for high-definition print clarity
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1200,
    });

    const imgData = canvas.toDataURL('image/png', 1.0);

    // 2. Initialize jsPDF in A5 Landscape format (210mm x 148mm)
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a5',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // 3. Add margin of 4mm around invoice slip
    const margin = 4;
    const renderWidth = pdfWidth - margin * 2;
    const renderHeight = (canvas.height * renderWidth) / canvas.width;

    // Center vertically if needed
    const yPos = Math.max(margin, (pdfHeight - renderHeight) / 2);

    pdf.addImage(imgData, 'PNG', margin, yPos, renderWidth, renderHeight, undefined, 'FAST');

    // 4. Save and download PDF file
    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    return false;
  }
}
