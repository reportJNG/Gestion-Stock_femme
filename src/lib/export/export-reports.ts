/**
 * export-reports.ts
 *
 * Dependencies (install once):
 *   npm install jspdf jspdf-autotable xlsx-js-style
 *
 * xlsx-js-style is a drop-in replacement for xlsx that adds full cell
 * styling support (.s property).
 */
import jsPDF from 'jspdf';
import autoTable, { type CellHookData } from 'jspdf-autotable';
import * as XLSX from 'xlsx-js-style';
import { formatDZD, formatNumber } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReportData {
  revenue: number;
  profit: number;
  transactions: number;
  stockValue: number;
  lowStockCount: number;
  chart: { name: string; revenue: number; profit: number }[];
  topProducts: { name: string; sold: number; revenue: number }[];
}

type XlsxCell = { v: string | number; t: string; s: CellStyle; z?: string };
type XlsxWorksheet = XLSX.WorkSheet;

type JsPDFWithAutoTable = jsPDF & {
  lastAutoTable?: {
    finalY: number;
  };
};

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
  primary:   [220, 38,  38 ] as [number, number, number],
  dark:      [15,  23,  42 ] as [number, number, number],
  mid:       [100, 116, 139] as [number, number, number],
  light:     [248, 250, 252] as [number, number, number],
  border:    [226, 232, 240] as [number, number, number],
  white:     [255, 255, 255] as [number, number, number],
  green:     [34,  197, 94 ] as [number, number, number],
  amber:     [217, 119, 6  ] as [number, number, number],
  blue:      [2,   132, 199] as [number, number, number],
  gold:      [253, 224, 71 ] as [number, number, number],
  goldText:  [120, 90,  0  ] as [number, number, number],
} as const;

// ─── Shared helpers ───────────────────────────────────────────────────────────

function toFileDate(): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Africa/Algiers',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date()).split('/').reverse().join('-');
}

function toDisplayDateTime(): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Africa/Algiers',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date());
}

function marginPct(revenue: number, profit: number): string {
  if (!revenue) return '0.0 %';
  return ((profit / revenue) * 100).toFixed(1) + ' %';
}

// ══════════════════════════════════════════════════════════════════════════════
// PDF EXPORT
// ══════════════════════════════════════════════════════════════════════════════

// ─── PDF drawing helpers ──────────────────────────────────────────────────────

const HEADER_H  = 26;
const MARGIN    = 14;

function pdfPageWidth(doc: jsPDF) { return doc.internal.pageSize.width; }
function pdfPageHeight(doc: jsPDF) { return doc.internal.pageSize.height; }
function lastTableY(doc: jsPDF, fallback: number) {
  return (doc as JsPDFWithAutoTable).lastAutoTable?.finalY ?? fallback;
}

function drawHeader(doc: jsPDF, periodLabel: string) {
  const pw = pdfPageWidth(doc);
  doc.setFillColor(...C.primary);
  doc.rect(0, 0, pw, 16, 'F');
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.white);
  doc.text('GESTION STOCK', MARGIN, 11);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('RAPPORT DE VENTES', pw - MARGIN, 11, { align: 'right' });
  doc.setFillColor(...C.dark);
  doc.rect(0, 16, pw, 10, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(200, 210, 230);
  doc.text(`Période : ${periodLabel}`, MARGIN, 22.5);
  doc.text(`Généré le ${toDisplayDateTime()}`, pw - MARGIN, 22.5, { align: 'right' });
}

function drawFooters(doc: jsPDF) {
  const pw    = pdfPageWidth(doc);
  const ph    = pdfPageHeight(doc);
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.25);
    doc.line(MARGIN, ph - 14, pw - MARGIN, ph - 14);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.mid);
    doc.text('© Gestion Stock — Confidentiel', MARGIN, ph - 8);
    doc.text(`Page ${i} / ${pages}`, pw - MARGIN, ph - 8, { align: 'right' });
    doc.text(toDisplayDateTime(), pw / 2, ph - 8, { align: 'center' });
  }
}

function drawSectionTitle(doc: jsPDF, text: string, y: number): number {
  doc.setFillColor(...C.primary);
  doc.rect(MARGIN, y, 3, 8, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.dark);
  doc.text(text, MARGIN + 6, y + 6);
  return y + 13;
}

function drawRule(doc: jsPDF, y: number) {
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.25);
  doc.line(MARGIN, y, pdfPageWidth(doc) - MARGIN, y);
}

function drawKpiCard(
  doc: jsPDF,
  x: number, y: number, w: number,
  label: string, value: string,
  accent: [number, number, number]
) {
  const h = 21;
  doc.setFillColor(...C.white);
  doc.rect(x, y, w, h, 'F');
  doc.setFillColor(...accent);
  doc.rect(x, y, 2.5, h, 'F');
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.25);
  doc.rect(x, y, w, h, 'S');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.mid);
  doc.text(label.toUpperCase(), x + 6, y + 7);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.dark);
  doc.text(value, x + 6, y + 16.5);
}

// ─── Main PDF function ────────────────────────────────────────────────────────

export async function exportToPDF(data: ReportData, periodLabel: string) {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pw = pdfPageWidth(doc);
    drawHeader(doc, periodLabel);
    let y = HEADER_H + 6;

    const kpis: [string, string, [number, number, number]][] = [
      ['Revenus totaux',        formatDZD(data.revenue),                     C.primary],
      ['Bénéfice net',          formatDZD(data.profit),                      C.green  ],
      ['Transactions',          formatNumber(data.transactions),              C.amber  ],
      ['Valeur du stock',       formatDZD(data.stockValue),                  C.blue   ],
      ['Marge',                 marginPct(data.revenue, data.profit),         C.mid    ],
      ['Stock faible',          `${data.lowStockCount} articles`,             data.lowStockCount > 0 ? C.amber : C.green],
    ];

    const cols   = 3;
    const gap    = 3;
    const cardW  = (pw - MARGIN * 2 - gap * (cols - 1)) / cols;
    const cardH  = 21;
    const rowGap = 4;

    kpis.forEach(([label, value, accent], i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      drawKpiCard(doc, MARGIN + col * (cardW + gap), y + row * (cardH + rowGap), cardW, label, value, accent);
    });

    y += Math.ceil(kpis.length / cols) * (cardH + rowGap) + 6;
    drawRule(doc, y);
    y += 8;

    y = drawSectionTitle(doc, 'Revenus vs Bénéfices par période', y);

    const chartBody = data.chart.map((d) => [d.name, formatDZD(d.revenue), formatDZD(d.profit), marginPct(d.revenue, d.profit)]);
    const totalRevChart  = data.chart.reduce((s, d) => s + d.revenue, 0);
    const totalProfChart = data.chart.reduce((s, d) => s + d.profit,  0);
    chartBody.push(['TOTAL', formatDZD(totalRevChart), formatDZD(totalProfChart), marginPct(totalRevChart, totalProfChart)]);

    autoTable(doc, {
      startY: y,
      head: [['Période', 'Revenus (DZD)', 'Bénéfice (DZD)', 'Marge']],
      body: chartBody,
      theme: 'plain',
      headStyles: { fillColor: C.dark, textColor: C.white, fontStyle: 'bold', fontSize: 9, cellPadding: { top: 4, bottom: 4, left: 4, right: 4 } },
      bodyStyles: { fontSize: 8.5, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 }, textColor: C.dark },
      alternateRowStyles: { fillColor: C.light },
      tableLineColor: C.border,
      tableLineWidth: 0.2,
      margin: { left: MARGIN, right: MARGIN, top: 0, bottom: 20 },
      columnStyles: { 0: { cellWidth: 32 }, 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'center', cellWidth: 24 } },
      didParseCell: (hookData: CellHookData) => {
        if (hookData.section === 'body' && hookData.row.index === chartBody.length - 1) {
          hookData.cell.styles.fontStyle = 'bold';
          hookData.cell.styles.fillColor = C.dark;
          hookData.cell.styles.textColor = C.white;
        }
      },
      didDrawPage: () => { drawHeader(doc, periodLabel); },
    });

    y = lastTableY(doc, y) + 10;

    if (y > pdfPageHeight(doc) - 80) { doc.addPage(); drawHeader(doc, periodLabel); y = HEADER_H + 8; }
    y = drawSectionTitle(doc, 'Top Produits', y);

    const totalRevProds = data.topProducts.reduce((s, p) => s + p.revenue, 0);
    const prodsBody = data.topProducts.map((p, i) => [
      (i + 1).toString(), p.name, formatNumber(p.sold), formatDZD(p.revenue),
      totalRevProds > 0 ? ((p.revenue / totalRevProds) * 100).toFixed(1) + ' %' : '—',
    ]);
    prodsBody.push(['', 'TOTAL', formatNumber(data.topProducts.reduce((s, p) => s + p.sold, 0)), formatDZD(totalRevProds), '100.0 %']);

    autoTable(doc, {
      startY: y,
      head: [['#', 'Produit', 'Qté vendue', 'Revenus (DZD)', 'Part (%)']],
      body: prodsBody,
      theme: 'plain',
      headStyles: { fillColor: C.dark, textColor: C.white, fontStyle: 'bold', fontSize: 9, cellPadding: { top: 4, bottom: 4, left: 4, right: 4 } },
      bodyStyles: { fontSize: 8.5, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 }, textColor: C.dark },
      alternateRowStyles: { fillColor: C.light },
      tableLineColor: C.border,
      tableLineWidth: 0.2,
      margin: { left: MARGIN, right: MARGIN, top: 0, bottom: 20 },
      columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'center', cellWidth: 22 } },
      didParseCell: (hookData: CellHookData) => {
        const lastIdx = prodsBody.length - 1;
        if (hookData.section === 'body' && hookData.row.index === 0 && hookData.column.index === 1) {
          hookData.cell.styles.fillColor = C.gold;
          hookData.cell.styles.textColor = C.goldText;
          hookData.cell.styles.fontStyle = 'bold';
        }
        if (hookData.section === 'body' && hookData.row.index === lastIdx) {
          hookData.cell.styles.fillColor = C.dark;
          hookData.cell.styles.textColor = C.white;
          hookData.cell.styles.fontStyle = 'bold';
        }
      },
      didDrawPage: () => { drawHeader(doc, periodLabel); },
    });

    y = lastTableY(doc, y) + 10;

    if (y > pdfPageHeight(doc) - 40) { doc.addPage(); drawHeader(doc, periodLabel); y = HEADER_H + 8; }
    drawRule(doc, y);
    y += 6;

    const boxH = 22;
    doc.setFillColor(...C.light);
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.25);
    doc.rect(MARGIN, y, pw - MARGIN * 2, boxH, 'FD');
    doc.setFillColor(...C.primary);
    doc.rect(MARGIN, y, 3, boxH, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.mid);
    doc.text('RÉCAPITULATIF GLOBAL', MARGIN + 7, y + 7);

    const summaryItems = [
      `Revenus : ${formatDZD(data.revenue)}`,
      `Bénéfice : ${formatDZD(data.profit)}`,
      `Marge : ${marginPct(data.revenue, data.profit)}`,
      `Transactions : ${formatNumber(data.transactions)}`,
    ];

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.dark);
    const colW = (pw - MARGIN * 2 - 7) / 2;
    summaryItems.forEach((txt, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      doc.text(txt, MARGIN + 7 + col * colW, y + 14 + row * 6);
    });

    drawFooters(doc);
    doc.save(`rapport-ventes-${toFileDate()}.pdf`);
    return true;
  } catch (error) {
    console.error('PDF Export Error:', error);
    throw error;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// EXCEL EXPORT
// ══════════════════════════════════════════════════════════════════════════════

type XColor = string;

interface CellStyle {
  font?: { bold?: boolean; sz?: number; color?: { rgb: string }; name?: string; italic?: boolean };
  fill?: { fgColor: { rgb: string }; patternType: string };
  alignment?: { horizontal?: string; vertical?: string; wrapText?: boolean };
  border?: {
    top?: { style: string; color: { rgb: string } };
    bottom?: { style: string; color: { rgb: string } };
    left?: { style: string; color: { rgb: string } };
    right?: { style: string; color: { rgb: string } };
  };
}

function border(color: XColor = 'E2E8F0', style: string = 'thin') {
  const b = { style, color: { rgb: color } };
  return { top: b, bottom: b, left: b, right: b };
}

function headerStyle(bgRgb: XColor = '0F172A'): CellStyle {
  return { font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' }, name: 'Arial' }, fill: { fgColor: { rgb: bgRgb }, patternType: 'solid' }, alignment: { horizontal: 'center', vertical: 'center', wrapText: false }, border: border(bgRgb, 'medium') };
}

function dataStyle(alt: boolean, halign: 'left' | 'right' | 'center' = 'left'): CellStyle {
  return { font: { sz: 10, name: 'Arial', color: { rgb: '0F172A' } }, fill: { fgColor: { rgb: alt ? 'F8FAFC' : 'FFFFFF' }, patternType: 'solid' }, alignment: { horizontal: halign, vertical: 'center' }, border: border() };
}

function totalsStyle(halign: 'left' | 'right' | 'center' = 'right'): CellStyle {
  return { font: { bold: true, sz: 10, name: 'Arial', color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '0F172A' }, patternType: 'solid' }, alignment: { horizontal: halign, vertical: 'center' }, border: border('0F172A', 'medium') };
}

function titleStyle(): CellStyle {
  return { font: { bold: true, sz: 18, name: 'Arial', color: { rgb: 'DC2626' } }, fill: { fgColor: { rgb: 'FFFFFF' }, patternType: 'solid' }, alignment: { horizontal: 'left', vertical: 'center' } };
}

function subtitleStyle(): CellStyle {
  return { font: { italic: true, sz: 9, name: 'Arial', color: { rgb: '64748B' } }, fill: { fgColor: { rgb: 'FFFFFF' }, patternType: 'solid' }, alignment: { horizontal: 'left', vertical: 'center' } };
}

function sectionLabelStyle(): CellStyle {
  return { font: { bold: true, sz: 9, name: 'Arial', color: { rgb: 'DC2626' } }, fill: { fgColor: { rgb: 'FFFFFF' }, patternType: 'solid' }, alignment: { horizontal: 'left', vertical: 'center' } };
}

function kpiLabelStyle(accentRgb: XColor): CellStyle {
  return { font: { bold: true, sz: 8, name: 'Arial', color: { rgb: '64748B' } }, fill: { fgColor: { rgb: 'F8FAFC' }, patternType: 'solid' }, alignment: { horizontal: 'left', vertical: 'bottom' }, border: { top: { style: 'medium', color: { rgb: accentRgb } }, left: { style: 'thin', color: { rgb: 'E2E8F0' } }, right: { style: 'thin', color: { rgb: 'E2E8F0' } }, bottom: { style: 'hair', color: { rgb: 'E2E8F0' } } } };
}

function kpiValueStyle(accentRgb: XColor): CellStyle {
  return { font: { bold: true, sz: 12, name: 'Arial', color: { rgb: '0F172A' } }, fill: { fgColor: { rgb: 'F8FAFC' }, patternType: 'solid' }, alignment: { horizontal: 'left', vertical: 'top' }, border: { top: { style: 'hair', color: { rgb: 'E2E8F0' } }, left: { style: 'thin', color: { rgb: 'E2E8F0' } }, right: { style: 'thin', color: { rgb: 'E2E8F0' } }, bottom: { style: 'medium', color: { rgb: accentRgb } } } };
}

function goldStyle(): CellStyle {
  return { font: { bold: true, sz: 10, name: 'Arial', color: { rgb: '78560A' } }, fill: { fgColor: { rgb: 'FEF08A' }, patternType: 'solid' }, alignment: { horizontal: 'right', vertical: 'center' }, border: border('E2E8F0') };
}

function wc(ws: XlsxWorksheet, addr: string, v: string | number, s: CellStyle, z?: string) {
  ws[addr] = { v, t: typeof v === 'number' ? 'n' : 's', s, ...(z ? { z } : {}) };
}

interface TableSpec {
  ws: XlsxWorksheet;
  startRow: number;
  cols: number;
  headers: string[];
  rows: (string | number)[][];
  totalsRow?: (string | number)[];
  colAligns?: ('left' | 'right' | 'center')[];
  colFormats?: (string | undefined)[];
}

function buildTable({ ws, startRow, headers, rows, totalsRow, colAligns = [], colFormats = [] }: TableSpec): number {
  headers.forEach((h, c) => wc(ws, XLSX.utils.encode_cell({ r: startRow - 1, c }), h, headerStyle()));
  rows.forEach((row, ri) => {
    row.forEach((val, c) => {
      const align = colAligns[c] ?? (typeof val === 'number' ? 'right' : 'left');
      wc(ws, XLSX.utils.encode_cell({ r: startRow + ri, c }), val, dataStyle(ri % 2 === 1, align), colFormats[c]);
    });
  });
  let lastRow = startRow + rows.length;
  if (totalsRow) {
    totalsRow.forEach((val, c) => {
      const align = colAligns[c] ?? (typeof val === 'number' ? 'right' : 'left');
      wc(ws, XLSX.utils.encode_cell({ r: lastRow, c }), val, totalsStyle(align), colFormats[c]);
    });
    lastRow++;
  }
  return lastRow;
}

export async function exportToExcel(data: ReportData, periodLabel: string) {
  try {
    const wb = XLSX.utils.book_new();
    const dz = '#,##0 "DZD"';
    const pct = '0.0"%"';
    const totalRevProds = data.topProducts.reduce((s, p) => s + p.revenue, 0);
    const totalSold     = data.topProducts.reduce((s, p) => s + p.sold, 0);
    const globalMargin  = data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0;

    // SHEET 1
    {
      const ws: XlsxWorksheet = {};
      wc(ws, 'A1', 'Rapport de Ventes', titleStyle());
      wc(ws, 'A2', `Période : ${periodLabel}   |   Généré le ${toDisplayDateTime()}`, subtitleStyle());
      wc(ws, 'A3', '', {} as CellStyle);
      wc(ws, 'A4', 'INDICATEURS CLÉS', sectionLabelStyle());
      const kpis: [string, string | number, XColor, string | undefined][] = [
        ['REVENUS TOTAUX', data.revenue, 'DC2626', dz], ['BÉNÉFICE NET', data.profit, '16A34A', dz],
        ['TRANSACTIONS', data.transactions, 'D97706', undefined], ['VALEUR DU STOCK', data.stockValue, '0284C7', dz],
        ['MARGE GLOBALE', globalMargin, '7C3AED', pct], ['ARTICLES STOCK FAIBLE', data.lowStockCount, data.lowStockCount > 0 ? 'D97706' : '16A34A', undefined],
      ];
      const kpiColStarts = [0, 3, 6];
      kpis.forEach(([label, value, accent, fmt], i) => {
        const colOffset = kpiColStarts[i % 3];
        const baseRow = i < 3 ? 4 : 7;
        wc(ws, XLSX.utils.encode_cell({ r: baseRow, c: colOffset }), label, kpiLabelStyle(accent));
        wc(ws, XLSX.utils.encode_cell({ r: baseRow + 1, c: colOffset }), value, kpiValueStyle(accent), fmt);
      });
      wc(ws, 'A11', '', {} as CellStyle);
      wc(ws, 'A12', 'DONNÉES CONSOLIDÉES', sectionLabelStyle());
      buildTable({
        ws, startRow: 13, cols: 3,
        headers: ['Métrique', 'Valeur numérique', 'Valeur formatée'],
        rows: [
          ['Revenus totaux', data.revenue, formatDZD(data.revenue)],
          ['Bénéfice net', data.profit, formatDZD(data.profit)],
          ['Transactions', data.transactions, formatNumber(data.transactions)],
          ['Valeur du stock', data.stockValue, formatDZD(data.stockValue)],
          ['Marge globale (%)', globalMargin, `${globalMargin.toFixed(1)} %`],
          ['Articles en stock faible', data.lowStockCount, data.lowStockCount.toString()],
        ],
        colAligns: ['left', 'right', 'right'],
        colFormats: [undefined, '#,##0.##', undefined],
      });
      ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 25, c: 9 } });
      ws['!cols'] = [{ wch: 28 }, { wch: 22 }, { wch: 2 }, { wch: 28 }, { wch: 22 }, { wch: 2 }, { wch: 28 }, { wch: 22 }];
      ws['!rows'] = [{ hpt: 32 }, { hpt: 16 }, { hpt: 6 }, { hpt: 14 }, { hpt: 22 }, { hpt: 22 }];
      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }];
      XLSX.utils.book_append_sheet(wb, ws, 'Résumé');
    }

    // SHEET 2
    {
      const ws: XlsxWorksheet = {};
      const totalRevChart = data.chart.reduce((s, d) => s + d.revenue, 0);
      const totalProfChart = data.chart.reduce((s, d) => s + d.profit, 0);
      const rows = data.chart.map((d) => [d.name, d.revenue, d.profit, d.revenue > 0 ? (d.profit / d.revenue) * 100 : 0] as (string | number)[]);
      buildTable({
        ws, startRow: 1, cols: 4,
        headers: ['Période', 'Revenus (DZD)', 'Bénéfice (DZD)', 'Marge (%)'],
        rows,
        totalsRow: ['TOTAL', totalRevChart, totalProfChart, totalRevChart > 0 ? (totalProfChart / totalRevChart) * 100 : 0],
        colAligns: ['left', 'right', 'right', 'center'],
        colFormats: [undefined, dz, dz, pct],
      });
      const lastRow = rows.length + 2;
      ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: lastRow, c: 3 } });
      ws['!cols'] = [{ wch: 16 }, { wch: 22 }, { wch: 22 }, { wch: 14 }];
      ws['!rows'] = [{ hpt: 22 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Par Jour');
    }

    // SHEET 3
    {
      const ws: XlsxWorksheet = {};
      const rows = data.topProducts.map((p, i) => [i + 1, p.name, p.sold, p.revenue, totalRevProds > 0 ? (p.revenue / totalRevProds) * 100 : 0] as (string | number)[]);
      const nextRow = buildTable({
        ws, startRow: 1, cols: 5,
        headers: ['#', 'Produit', 'Qté vendue', 'Revenus (DZD)', 'Part (%)'],
        rows,
        totalsRow: ['', 'TOTAL', totalSold, totalRevProds, 100],
        colAligns: ['center', 'left', 'right', 'right', 'center'],
        colFormats: [undefined, undefined, '#,##0', dz, pct],
      });
      for (let c = 0; c < 5; c++) {
        const addr = XLSX.utils.encode_cell({ r: 1, c });
        if (ws[addr] && 'v' in ws[addr]) {
          const isLeft = c === 1;
          (ws[addr] as XlsxCell).s = { ...goldStyle(), alignment: { horizontal: isLeft ? 'left' : 'right', vertical: 'center' } };
        }
      }
      const rankAddr = XLSX.utils.encode_cell({ r: 1, c: 0 });
      if (ws[rankAddr] && 'v' in ws[rankAddr]) {
        const cell = ws[rankAddr] as XlsxCell;
        if (cell.s.alignment) cell.s.alignment.horizontal = 'center';
      }
      ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: nextRow, c: 4 } });
      ws['!cols'] = [{ wch: 5 }, { wch: 40 }, { wch: 14 }, { wch: 22 }, { wch: 12 }];
      ws['!rows'] = [{ hpt: 22 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Top Produits');
    }

    // SHEET 4
    {
      const ws: XlsxWorksheet = {};
      const rows = data.topProducts.map((p, i) => [i + 1, p.name, p.sold, p.revenue, totalRevProds > 0 ? (p.revenue / totalRevProds) * 100 : 0, periodLabel, toFileDate()] as (string | number)[]);
      buildTable({
        ws, startRow: 1, cols: 7,
        headers: ['Rang', 'Produit', 'Quantite_Vendue', 'Revenus_DZD', 'Part_Pct', 'Periode', 'Date_Export'],
        rows,
        colAligns: ['center', 'left', 'right', 'right', 'center', 'left', 'center'],
        colFormats: [undefined, undefined, '#,##0', '#,##0.00', '0.00', undefined, undefined],
      });
      ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length + 1, c: 6 } });
      ws['!cols'] = [{ wch: 6 }, { wch: 42 }, { wch: 18 }, { wch: 16 }, { wch: 10 }, { wch: 24 }, { wch: 14 }];
      ws['!rows'] = [{ hpt: 22 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Données Brutes');
    }

    XLSX.writeFile(wb, `rapport-ventes-${toFileDate()}.xlsx`);
    return true;
  } catch (error) {
    console.error('Excel Export Error:', error);
    throw error;
  }
}
