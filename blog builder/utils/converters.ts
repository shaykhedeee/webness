import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Triggers a browser download for a file created from a string.
 * @param content The string content of the file.
 * @param filename The desired name of the file.
 * @param mimeType The MIME type of the file.
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
a.href = url;
a.download = filename;
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
URL.revokeObjectURL(url);
}

/**
 * Converts a string of HTML into a .doc file and triggers a download.
 * This is a trick that wraps HTML in a format Word can open.
 * @param htmlContent The HTML string to convert.
 * @param title The title of the document.
 * @param filename The desired filename for the download.
 */
export function downloadDoc(htmlContent: string, title: string, filename: string) {
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>${title}</title></head><body>`;
    const footer = "</body></html>";
    const sourceHTML = header + htmlContent + footer;
    downloadFile(sourceHTML, filename, 'application/msword');
}

/**
 * Captures an HTML element, converts it to a canvas, and generates a PDF.
 * @param element The HTML element to capture.
 * @param filename The desired filename for the download.
 */
export async function downloadPdf(element: HTMLElement, filename: string) {
    const canvas = await html2canvas(element, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: [canvas.width, canvas.height]
    });
    
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(filename);
}


/**
 * A basic converter from Markdown to HTML for previewing.
 * Supports H1-H3, bold, italic, lists, and paragraphs.
 * @param md The Markdown string.
 * @returns An HTML string.
 */
export function markdownToHtml(md: string): string {
    let html = md
        // Headers
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        
        // Bold and Italic
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')

        // Unordered lists
        .replace(/^\s*[-*] (.*)/gim, '<ul>\n<li>$1</li>\n</ul>')
        .replace(/<\/ul>\n<ul>/gim, '')

        // Ordered lists
        .replace(/^\s*\d+\. (.*)/gim, '<ol>\n<li>$1</li>\n</ol>')
        .replace(/<\/ol>\n<ol>/gim, '');

    // Paragraphs (wrap lines that are not part of other blocks)
    html = html.split('\n').map(line => {
        if (line.trim() === '') return '';
        if (line.match(/<(h[1-3]|ul|ol|li)/)) return line;
        return `<p>${line}</p>`;
    }).join('\n').replace(/\n/g, '');

    return html;
}