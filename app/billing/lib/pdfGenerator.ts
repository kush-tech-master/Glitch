import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

/**
 * Robustly resolve jsPDF constructor across different bundler environments (ESM / CJS)
 */
function getJsPdfInstance(options: any) {
  try {
    if (typeof jsPDF === 'function') {
      return new jsPDF(options);
    }
    const anyJsPdf = jsPDF as any;
    if (typeof anyJsPdf?.jsPDF === 'function') {
      return new anyJsPdf.jsPDF(options);
    }
    if (typeof anyJsPdf?.default === 'function') {
      return new anyJsPdf.default(options);
    }
  } catch (e) {
    console.warn('Direct jsPDF instantiation error, trying fallback:', e);
  }
  return new (jsPDF as any)(options);
}

/**
 * Exports any DOM element as a crisp, landscape retail invoice PDF
 * Uses html-to-image to support Tailwind CSS v4 modern color functions (lab, oklch) natively
 * @param elementId The id of the DOM element to capture (e.g. 'printable-bill')
 * @param filename The downloaded file name (e.g. 'GLITCH-INVOICE-GL-00001.pdf')
 */
export async function exportElementToPdf(elementId: string, filename: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found for PDF generation`);
    return false;
  }

  try {
    // 1. Capture element to high-resolution PNG using native SVG foreignObject (supports LAB/OKLCH colors)
    const imgData = await toPng(element, {
      pixelRatio: 2.5,
      backgroundColor: '#ffffff',
      cacheBust: true,
      filter: (node) => {
        // Exclude elements with print:hidden if any
        if (node instanceof HTMLElement && node.classList?.contains('print:hidden')) {
          return false;
        }
        return true;
      },
    });

    // 2. Load image to get natural aspect ratio
    const img = new Image();
    img.src = imgData;
    await new Promise((resolve, reject) => {
      img.onload = () => resolve(true);
      img.onerror = reject;
    });

    const imgWidth = img.width || 1200;
    const imgHeight = img.height || 700;

    // 3. Initialize jsPDF in A5 Landscape format (210mm x 148mm)
    const pdf = getJsPdfInstance({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a5',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // 4. Calculate dimensions with 4mm margin
    const margin = 4;
    const renderWidth = pdfWidth - margin * 2;
    const renderHeight = (imgHeight * renderWidth) / imgWidth;

    // Center vertically
    const yPos = Math.max(margin, (pdfHeight - renderHeight) / 2);

    pdf.addImage(imgData, 'PNG', margin, yPos, renderWidth, renderHeight, undefined, 'FAST');

    // 5. Save and trigger download
    try {
      pdf.save(filename);
    } catch (saveError) {
      console.warn('pdf.save() failed, attempting direct blob download:', saveError);
      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
    }

    return true;
  } catch (error) {
    console.error('Failed to generate PDF with html-to-image:', error);
    return false;
  }
}
