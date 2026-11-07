/**
 * Utility for isolated document printing & file downloads in La Facultad Studio
 */

export function printElementById(elementId: string, title: string = 'Documento_La_Facultad_Studio') {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`Element #${elementId} not found, falling back to standard print`);
    window.print();
    return;
  }

  // Create an isolated hidden iframe for printing
  const printIframe = document.createElement('iframe');
  printIframe.style.position = 'fixed';
  printIframe.style.right = '0';
  printIframe.style.bottom = '0';
  printIframe.style.width = '0px';
  printIframe.style.height = '0px';
  printIframe.style.border = '0';
  printIframe.style.zIndex = '-9999';
  document.body.appendChild(printIframe);

  const doc = printIframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  // Gather stylesheet links & embedded styles
  const headStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map(style => style.outerHTML)
    .join('\n');

  // Clone document inner content
  const contentHtml = element.innerHTML;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      ${headStyles}
      <style>
        @page {
          size: A4 portrait;
          margin: 10mm;
        }
        *, ::before, ::after {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          background-color: #ffffff !important;
          color: #0d0d0d !important;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          padding: 0 !important;
          margin: 0 !important;
          width: 100% !important;
        }
        .print-hidden, button, .no-print {
          display: none !important;
        }
        /* Convert dark studio elements to clean white paper print layout */
        .bg-\\[\\#121214\\], .bg-neutral-950, .bg-slate-900, .bg-\\[\\#111113\\], .bg-\\[\\#18181b\\] {
          background-color: #ffffff !important;
          color: #0d0d0d !important;
          border-color: #d1d5db !important;
        }
        .text-slate-200, .text-slate-300, .text-slate-400, .text-slate-100 {
          color: #1f2937 !important;
        }
        .text-white {
          color: #000000 !important;
        }
        .bg-amber-400 {
          background-color: #f59e0b !important;
          color: #000000 !important;
        }
        .bg-red-600, .bg-red-700 {
          background-color: #dc2626 !important;
          color: #ffffff !important;
        }
        .border-neutral-800, .border-gray-800, .border-slate-800 {
          border-color: #e5e7eb !important;
        }
        .shadow-2xl, .shadow-xl, .shadow-lg, .shadow-md {
          box-shadow: none !important;
        }
      </style>
    </head>
    <body>
      <div style="max-width: 800px; margin: 0 auto; padding: 12px;">
        ${contentHtml}
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.focus();
            window.print();
          }, 350);
        };
      </script>
    </body>
    </html>
  `);
  doc.close();

  // Clean up iframe after 30 seconds
  setTimeout(() => {
    if (document.body.contains(printIframe)) {
      document.body.removeChild(printIframe);
    }
  }, 30000);
}

export function downloadDocumentHtml(elementId: string, filename: string = 'Pase_o_Contrato_LaFacultad.html') {
  const element = document.getElementById(elementId);
  if (!element) return;

  const contentHtml = element.innerHTML;
  const fullDocument = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${filename.replace('.html', '')}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #0d0d0d; color: #ffffff; font-family: sans-serif; padding: 20px; }
    @media print {
      body { background-color: #ffffff; color: #000000; }
    }
  </style>
</head>
<body>
  <div style="max-width: 850px; margin: 0 auto;">
    ${contentHtml}
  </div>
</body>
</html>`;

  const blob = new Blob([fullDocument], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
