export const CAT_CODES: Record<string, string> = {
  'T-shirts / Hauts': 'TS',
  'Chaussures': 'SH',
  'Pantalons / Jeans': 'PT',
  'Vestes / Manteaux': 'JK',
  'Accessoires': 'AC',
  'Autres Vetements': 'OT',
};

export const SIZE_CODE_MAP: Record<string, string> = {
  'XS': 'XSS',
  'S': 'SML',
  'M': 'MED',
  'L': 'LRG',
  'XL': 'XLG',
  'XXL': 'XXL',
  '3XL': '3XL',
  'Unique': 'UNQ',
  'S/M': 'SMM',
  'M/L': 'MLL',
};

export const SIZES_MAP = {
  clothing: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
  shoes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
  waist: ['28', '30', '32', '34', '36', '38', '40', '42', '44'],
  free: ['Unique'],
} as const;

export function normalizeSizeCode(size: string): string {
  if (SIZE_CODE_MAP[size]) return SIZE_CODE_MAP[size];
  if (/^\d+$/.test(size)) return size.padStart(3, '0');
  return size.toUpperCase().slice(0, 3).padEnd(3, 'X');
}

export function generateSKU(
  catCode: string,
  seqNum: number,
  colorCode: string,
  sizeCode: string
): string {
  return `${catCode.toUpperCase()}${String(seqNum).padStart(4, '0')}${colorCode.toUpperCase()}${sizeCode.toUpperCase()}`;
}