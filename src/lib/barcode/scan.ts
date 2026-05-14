export function normalizeScannedBarcode(value: string): string {
  return value.trim().replace(/\s+/g, '').toUpperCase();
}

export function isAppBarcode(value: string): boolean {
  return /^[A-Z0-9]{2}\d{4}[A-Z0-9]{2}[A-Z0-9]{3}$/.test(value);
}
