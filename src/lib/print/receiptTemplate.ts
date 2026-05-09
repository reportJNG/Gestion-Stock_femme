import { formatDZD, formatDate } from '@/lib/utils';
import type { Sale, SaleItem } from '@/types';

export function generateReceiptHTML(sale: Sale & { items: SaleItem[] }, shopName: string = 'Ma Boutique'): string {
  const items = sale.items || [];

  return `
    <div style="
      font-family: 'Courier New', monospace;
      width: 80mm;
      padding: 4mm;
      font-size: 12px;
      line-height: 1.4;
    ">
      <div style="text-align: center; margin-bottom: 4mm;">
        <h2 style="margin: 0; font-size: 14px;">${shopName}</h2>
        <p style="margin: 2px 0; font-size: 10px;">Ticket de caisse</p>
        <p style="margin: 2px 0; font-size: 10px;">#${sale.sale_number}</p>
        <p style="margin: 2px 0; font-size: 10px;">${formatDate(sale.created_at)}</p>
      </div>

      <hr style="border: none; border-top: 1px dashed #000; margin: 3mm 0;" />

      ${items.map(item => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 2mm;">
          <div style="flex: 1;">
            <div>${item.product_name}</div>
            <div style="font-size: 10px; color: #666;">${[item.color_name, item.size].filter(Boolean).join(' / ')} x${item.quantity}</div>
          </div>
          <div style="text-align: right;">${formatDZD(item.subtotal_ttc)}</div>
        </div>
      `).join('')}

      <hr style="border: none; border-top: 1px dashed #000; margin: 3mm 0;" />

      <div style="display: flex; justify-content: space-between;">
        <span>Total HT:</span>
        <span>${formatDZD(sale.total_ht)}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span>TVA:</span>
        <span>${formatDZD(sale.tva_amount)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 2mm; font-size: 14px;">
        <span>Total TTC:</span>
        <span>${formatDZD(sale.total_ttc)}</span>
      </div>

      <hr style="border: none; border-top: 1px dashed #000; margin: 3mm 0;" />

      <div style="text-align: center; font-size: 10px; margin-top: 4mm;">
        <p>Merci pour votre achat!</p>
        ${sale.customer_name ? `<p>Client: ${sale.customer_name}</p>` : ''}
      </div>
    </div>
  `;
}
