import JsBarcode from 'jsbarcode';
import { DEFAULT_LABEL_SIZE_MM, type LabelSizeMm } from '@/lib/print/xprinter';

export interface LabelData {
  barcode: string;
  productName: string;
  brandName?: string;
  colorName?: string;
  size?: string;
  priceTTC: number;
  currency?: string;
}

function escapeHtml(value: string | number | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateBarcodeSvg(barcode: string): string {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  JsBarcode(svg, barcode, {
    format: 'CODE128',
    width: 1.25,
    height: 42,
    displayValue: false,
    margin: 8,
    background: '#ffffff',
    lineColor: '#000000',
  });

  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('aria-label', `Barcode ${barcode}`);

  return new XMLSerializer().serializeToString(svg);
}

export function generateLabelHTML(data: LabelData, index: number): string {
  const { barcode, productName, brandName, colorName, size, priceTTC, currency = 'DZD' } = data;
  const variantLine = [colorName, size].filter(Boolean).join(' / ');
  const priceFormatted = `${Number(priceTTC).toLocaleString('fr-DZ')} ${currency}`;

  let barcodeSvg = '';
  try {
    barcodeSvg = generateBarcodeSvg(barcode);
  } catch {
    barcodeSvg = '<div class="barcode-error">Code-barres invalide</div>';
  }

  return `
    <section class="thermal-label" aria-label="Etiquette ${index + 1}">
      ${brandName ? `<div class="label-brand">${escapeHtml(brandName)}</div>` : ''}
      <div class="label-name">${escapeHtml(productName)}</div>
      ${variantLine ? `<div class="label-variant">${escapeHtml(variantLine)}</div>` : ''}
      <div class="barcode-wrap">${barcodeSvg}</div>
      <div class="barcode-text">${escapeHtml(barcode)}</div>
      <div class="label-price">${escapeHtml(priceFormatted)}</div>
    </section>
  `;
}

export function generateLabelsGridHTML(labels: LabelData[]): string {
  return `
    <main class="print-root">
      ${labels.map((label, index) => generateLabelHTML(label, index)).join('')}
    </main>
  `;
}

export function createLabelStyles(size: LabelSizeMm = DEFAULT_LABEL_SIZE_MM): string {
  return `
    @page {
      size: ${size.width}mm ${size.height}mm;
      margin: 0;
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      width: ${size.width}mm;
      min-height: ${size.height}mm;
      margin: 0;
      padding: 0;
      background: #ffffff;
    }

    body {
      color: #000000;
      font-family: Arial, Helvetica, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .print-root {
      width: ${size.width}mm;
      margin: 0;
      padding: 0;
    }

    .thermal-label {
      width: ${size.width}mm;
      height: ${size.height}mm;
      margin: 0;
      padding: 2.2mm 3mm 2mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      overflow: hidden;
      page-break-after: always;
      break-after: page;
      background: #ffffff;
    }

    .thermal-label:last-child {
      page-break-after: auto;
      break-after: auto;
    }

    .label-brand {
      max-width: 52mm;
      font-size: 6pt;
      line-height: 1.1;
      text-transform: uppercase;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .label-name {
      max-width: 52mm;
      margin-top: 0.5mm;
      font-size: 8pt;
      font-weight: 700;
      line-height: 1.15;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .label-variant {
      max-width: 52mm;
      margin-top: 0.7mm;
      font-size: 6.5pt;
      line-height: 1.1;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .barcode-wrap {
      width: 50mm;
      height: 14mm;
      margin-top: 1.2mm;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background: #ffffff;
    }

    .barcode-wrap svg {
      width: 50mm;
      height: 14mm;
      display: block;
    }

    .barcode-error {
      width: 50mm;
      padding: 1mm;
      border: 0.2mm solid #000000;
      font-size: 6pt;
      text-align: center;
    }

    .barcode-text {
      max-width: 52mm;
      margin-top: 0.7mm;
      font-family: "Courier New", monospace;
      font-size: 6pt;
      line-height: 1;
      letter-spacing: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .label-price {
      margin-top: 1mm;
      font-size: 11pt;
      font-weight: 700;
      line-height: 1;
      white-space: nowrap;
    }

    @media print {
      html,
      body {
        width: ${size.width}mm;
        height: ${size.height}mm;
        overflow: hidden;
      }
    }
  `;
}

export const LABEL_STYLES = createLabelStyles();
