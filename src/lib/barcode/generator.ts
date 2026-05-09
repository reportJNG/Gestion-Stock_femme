import JsBarcode from 'jsbarcode';

export function generateBarcodeSVG(barcode: string): string {
  if (typeof document === 'undefined') return '';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('id', `barcode-${barcode}`);

  try {
    JsBarcode(svg, barcode, {
      format: 'CODE128',
      width: 2,
      height: 40,
      displayValue: true,
      fontSize: 12,
      margin: 4,
    });
    return svg.outerHTML;
  } catch {
    return '';
  }
}

export function renderBarcodeToElement(barcode: string, elementId: string): void {
  if (typeof document === 'undefined') return;

  const element = document.getElementById(elementId);
  if (!element) return;

  element.innerHTML = '';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  try {
    JsBarcode(svg, barcode, {
      format: 'CODE128',
      width: 2,
      height: 40,
      displayValue: true,
      fontSize: 12,
      margin: 4,
    });
    element.appendChild(svg);
  } catch (err) {
    console.error('Failed to render barcode:', err);
  }
}
