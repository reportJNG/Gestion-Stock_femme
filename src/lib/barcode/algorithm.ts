import { normalizeSizeCode, generateSKU } from './constants';

export type BarcodeParts = {
  category: string;
  sequence: string;
  color: string;
  size: string;
};

export function parseBarcode(barcode: string): BarcodeParts | null {
  if (barcode.length !== 11) return null;

  return {
    category: barcode.slice(0, 2),
    sequence: barcode.slice(2, 6),
    color: barcode.slice(6, 8),
    size: barcode.slice(8, 11),
  };
}

export function generateBarcode(
  catCode: string,
  seqNum: number,
  colorCode: string,
  sizeValue: string
): string {
  const sizeCode = normalizeSizeCode(sizeValue);
  const safeColor = colorCode.toUpperCase().slice(0, 2).padEnd(2, 'X'); // ← add this
  return generateSKU(catCode, seqNum, safeColor, sizeCode);
}
export { normalizeSizeCode, generateSKU };
