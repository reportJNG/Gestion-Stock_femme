export const XPRINTER_XP_470B = {
  model: 'Xprinter XP-470B',
  dpi: 203,
  dotsPerMm: 8,
  maxPrintWidthMm: 108,
  defaultSpeedIps: 4,
} as const;

export type LabelSizeMm = {
  width: number;
  height: number;
};

export const LABEL_SIZE_PRESETS_MM = {
  '40x30': { width: 40, height: 30 },
  '50x30': { width: 50, height: 30 },
  '58x40': { width: 58, height: 40 },
  '80x50': { width: 80, height: 50 },
  '100x150': { width: 100, height: 150 },
} as const satisfies Record<string, LabelSizeMm>;

export const DEFAULT_LABEL_SIZE_MM = LABEL_SIZE_PRESETS_MM['58x40'];

export function mmToDots(mm: number): number {
  return Math.round(mm * XPRINTER_XP_470B.dotsPerMm);
}
