export interface LabelData {
  barcode: string;       // ex: TS0001BKXLG — vient directement de product_variants.barcode
  productName: string;
  brandName?: string;
  colorName?: string;
  size?: string;
  priceTTC: number;      // product.price_ttc (HT × (1 + tva/100))
  currency?: string;     // défaut 'DZD'
}

/**
 * Génère le HTML d'UNE étiquette.
 * L'id du SVG est unique (bc-${barcode}) pour que JsBarcode
 * puisse cibler chaque étiquette indépendamment.
 */
export function generateLabelHTML(data: LabelData, targetId?: string): string {
  const { barcode, productName, brandName, colorName, size, priceTTC, currency = 'DZD' } = data;
  const barcodeTargetId = targetId ?? `bc-${barcode}`;

  const variantLine = [colorName, size].filter(Boolean).join(' / ');
  const priceFormatted = `${Number(priceTTC).toLocaleString('fr-DZ')} ${currency}`;

  return `
    <div style="
      width: 50mm;
      min-height: 30mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2mm 3mm;
      box-sizing: border-box;
      font-family: Arial, sans-serif;
      border: 0.5pt solid #555;
      border-radius: 2mm;
      gap: 0.5mm;
      page-break-inside: avoid;
      overflow: hidden;
    ">
      ${brandName ? `
      <div style="font-size: 5.5pt; text-transform: uppercase; letter-spacing: 0.5pt; color: #888;">
        ${brandName}
      </div>` : ''}

      <div style="
        font-size: 7.5pt;
        font-weight: bold;
        text-align: center;
        line-height: 1.2;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      ">${productName}</div>

      ${variantLine ? `
      <div style="font-size: 6pt; color: #444; text-align: center;">
        ${variantLine}
      </div>` : ''}

      <svg
        id="${barcodeTargetId}"
        data-barcode="${barcode}"
        style="width: 44mm; height: 10mm; margin-top: 1.5mm;"
      ></svg>

      <div style="font-size: 5pt; font-family: monospace; color: #333; letter-spacing: 0.5pt;">
        ${barcode}
      </div>

      <div style="font-size: 11pt; font-weight: bold; margin-top: 0.5mm;">
        ${priceFormatted}
      </div>
    </div>
  `;
}

/**
 * Génère la grille complète de toutes les étiquettes (wrapper).
 */
export function generateLabelsGridHTML(labels: LabelData[]): string {
  return `
    <div style="
      display: grid;
      grid-template-columns: repeat(4, 50mm);
      gap: 3mm;
      padding: 8mm;
    ">
      ${labels.map((label, index) => generateLabelHTML(label, `bc-${index}`)).join('')}
    </div>
  `;
}

export const LABEL_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }

  @media print {
    @page { size: A4 portrait; margin: 4mm; }
    body  { padding: 0; }
  }
`;
