const JSBARCODE_CDN = 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js';

export interface PrintOptions {
  title?: string;
  /** Injecter JsBarcode et générer les barcodes Code128 après le rendu */
  withBarcodes?: boolean;
  /** Délai (ms) avant window.print() — laisser le temps au SVG de se rendre */
  printDelay?: number;
  extraStyles?: string;
}

/**
 * Ouvre une fenêtre d'impression avec le contenu HTML fourni.
 *
 * Si `withBarcodes: true`, JsBarcode est chargé via CDN et tous les
 * éléments <svg id="bc-*"> sont convertis en Code128 avant l'impression.
 *
 * Retourne un callback pour fermer manuellement la fenêtre si besoin.
 */
export function openPrintWindow(
  htmlContent: string,
  options: PrintOptions = {},
): () => void {
  const {
    title       = 'Impression',
    withBarcodes = false,
    printDelay   = withBarcodes ? 400 : 200,
    extraStyles  = '',
  } = options;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Impossible d\'ouvrir la fenêtre d\'impression — popups bloqués ?');
    return () => {};
  }

  // Script JsBarcode + auto-scan de tous les SVG id="bc-*"
  const barcodeScript = withBarcodes
    ? `
      <script src="${JSBARCODE_CDN}"><\/script>
      <script>
        function renderBarcodes() {
          document.querySelectorAll('svg[id^="bc-"]').forEach(function(svg) {
            var value = svg.id.replace('bc-', '');
            try {
              JsBarcode(svg, value, {
                format:       'CODE128',
                width:         1.4,
                height:        38,
                displayValue:  false,
                margin:        0,
                background:   '#ffffff',
                lineColor:    '#000000',
              });
            } catch (e) {
              svg.style.display = 'none';
              console.warn('Barcode error for', value, e);
            }
          });
        }
      <\/script>`
    : '';

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <title>${title}</title>
      ${barcodeScript}
      <style>
        @page { margin: 0; }
        body  { margin: 0; padding: 0; }
        ${extraStyles}
      </style>
    </head>
    <body>
      ${htmlContent}
      <script>
        window.onload = function () {
          ${withBarcodes ? 'renderBarcodes();' : ''}
          setTimeout(function () {
            window.print();
            window.onafterprint = function () { window.close(); };
          }, ${printDelay});
        };
      <\/script>
    </body>
    </html>
  `);

  printWindow.document.close();
  return () => printWindow.close();
}