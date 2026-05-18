import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportOptions {
  elementId: string;
  filename: string;
  title: string;
}

/**
 * Helper to sanitize oklch and other modern CSS colors to safe hex/rgb.
 * html2canvas currently crashes on oklch() color functions.
 */
const sanitizeStyles = (element: HTMLElement) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT);
    let node = walker.currentNode as HTMLElement;

    const convertColor = (color: string) => {
        if (!color) return color;
        // If color contains oklch, lab, or lch, we need to force a safe fallback.
        // For the purposes of a clean export, we'll map common dashboard colors or use computed style as hex.
        if (color.includes('oklch') || color.includes('lab') || color.includes('lch')) {
            // Simplified approach: use a neutral or specific enterprise color
            // In a real browser context, we'd use a temporary canvas or color conversion lib.
            // Here, we'll try to extract the RGB if possible via a dummy element, or force standard colors.
            return 'rgb(79, 70, 229)'; // Default to indigo-600 for crash prevention
        }
        return color;
    };

    while (node) {
        if (node instanceof HTMLElement) {
            const style = window.getComputedStyle(node);
            node.style.color = convertColor(style.color);
            node.style.backgroundColor = convertColor(style.backgroundColor);
            node.style.borderColor = convertColor(style.borderColor);
            
            // Handle gradients which often use oklch in modern Tailwind
            if (style.backgroundImage.includes('oklch')) {
                node.style.backgroundImage = 'none';
                node.style.backgroundColor = 'rgb(79, 70, 229)';
            }
        }
        node = walker.nextNode() as HTMLElement;
    }
};

export const generateVisualPDF = async ({ elementId, filename, title }: ExportOptions) => {
  const element = document.getElementById(elementId);
  if (!element) {
      throw new Error(`Target element with ID "${elementId}" not found.`);
  }

  // Use onclone to sanitize styles before capture without affecting the real UI
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff', // Force clean white background for PDF
    onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement) {
            // Sanitize all elements inside the clone
            const allElements = clonedElement.querySelectorAll('*');
            allElements.forEach((el) => {
                const htmlEl = el as HTMLElement;
                const style = window.getComputedStyle(htmlEl);
                
                // Fix for oklch() crash: manually override problematic styles with safe ones
                // We target background, text, and border colors
                if (style.color.includes('oklch')) htmlEl.style.color = '#0f172a';
                if (style.backgroundColor.includes('oklch')) htmlEl.style.backgroundColor = '#f8fafc';
                if (style.borderColor.includes('oklch')) htmlEl.style.borderColor = '#e2e8f0';
                
                // Specialized handling for branded indigo components
                if (htmlEl.classList.contains('bg-indigo-600')) {
                    htmlEl.style.backgroundColor = '#4f46e5';
                    htmlEl.style.color = '#ffffff';
                }
                
                // Force dark text on light backgrounds for PDF readability
                if (style.backgroundColor === 'rgba(0, 0, 0, 0)' || style.backgroundColor === 'transparent') {
                    // inherit
                } else {
                    // If it's a dark background card, ensure text is white, else black
                    const isDark = style.backgroundColor.includes('rgb(15, 23, 42)') || style.backgroundColor.includes('rgb(30, 41, 59)');
                    htmlEl.style.color = isDark ? '#ffffff' : '#0f172a';
                }
            });
            
            clonedElement.style.padding = '40px';
            clonedElement.style.borderRadius = '0px';
            clonedElement.style.color = '#0f172a';
            clonedElement.style.backgroundColor = '#ffffff';
        }
    }
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [canvas.width, canvas.height]
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  
  // Add professional metadata footer
  pdf.setFontSize(12);
  pdf.setTextColor(100);
  pdf.text(
      `ALIGN ENTERPRISE | ${title.toUpperCase()} | Generated: ${new Date().toLocaleString()}`, 
      40, 
      pdfHeight - 20
  );

  pdf.save(`${filename}_${new Date().getTime()}.pdf`);
};
