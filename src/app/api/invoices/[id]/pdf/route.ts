import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * Returns a print-ready HTML invoice that the browser can render and print to PDF.
 * Uses inline CSS for clean print formatting.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, businessName: true, ownerName: true, address: true, district: true, area: true, pin: true, phone: true, gst: true } },
      order: {
        include: {
          items: { include: { product: { select: { name: true, sku: true, hsn: true, packagingSize: true } } } },
          salesman: { select: { name: true } },
        },
      },
    },
  })
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const settings = await db.setting.findMany()
  const settingMap = Object.fromEntries(settings.map((s) => [s.key, s.value]))
  const companyName = settingMap.company_name ?? 'Rise Foods'
  const companyGst = settingMap.company_gst ?? '09ABCDE1234F1Z5'
  const companyFssai = settingMap.company_fssai ?? '12345678901234'
  const companyAddress = settingMap.company_address ?? 'Betiahata Industrial Area, Gorakhpur, UP 273001'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoice.invoiceNo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', -apple-system, sans-serif; color: #1a1a1a; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 30px; border-bottom: 2px solid #f97316; margin-bottom: 30px; }
    .brand { display: flex; gap: 12px; align-items: center; }
    .brand-mark { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #f97316, #f59e0b); display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: 700; }
    .brand-name { font-size: 22px; font-weight: 700; }
    .brand-sub { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
    .brand-addr { font-size: 11px; color: #666; margin-top: 8px; line-height: 1.5; }
    .brand-meta { font-size: 10px; color: #666; margin-top: 4px; }
    .invoice-meta { text-align: right; }
    .invoice-no { font-size: 28px; font-weight: 700; color: #f97316; }
    .invoice-label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
    .invoice-date { font-size: 12px; color: #333; margin-top: 6px; }
    .invoice-status { display: inline-block; padding: 4px 12px; border-radius: 999px; background: ${invoice.status === 'paid' ? '#dcfce7' : invoice.status === 'overdue' ? '#fee2e2' : '#fef3c7'}; color: ${invoice.status === 'paid' ? '#16a34a' : invoice.status === 'overdue' ? '#dc2626' : '#d97706'}; font-size: 11px; font-weight: 600; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
    .party-box { padding: 16px; background: #f9fafb; border-radius: 8px; }
    .party-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; font-weight: 600; }
    .party-name { font-size: 14px; font-weight: 600; }
    .party-line { font-size: 12px; color: #555; margin-top: 2px; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #f3f4f6; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #555; font-weight: 600; }
    th:last-child, th:nth-last-child(2) { text-align: right; }
    td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
    td:last-child, td:nth-last-child(2) { text-align: right; }
    .totals { margin-left: auto; width: 280px; margin-bottom: 30px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; }
    .total-row.grand { border-top: 2px solid #1a1a1a; padding-top: 12px; margin-top: 8px; font-size: 18px; font-weight: 700; }
    .total-row.paid { color: #16a34a; }
    .total-row.balance { color: #dc2626; font-weight: 600; }
    .footer { padding-top: 20px; border-top: 1px solid #e5e7eb; margin-top: 40px; }
    .footer-note { font-size: 11px; color: #666; line-height: 1.6; }
    .footer-thanks { font-size: 14px; font-weight: 600; color: #f97316; margin-top: 12px; }
    .signature { margin-top: 40px; text-align: right; }
    .signature-line { border-top: 1px solid #1a1a1a; width: 200px; margin-left: auto; padding-top: 6px; font-size: 11px; color: #666; }
    @media print {
      body { padding: 20px; }
      @page { margin: 1.5cm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">
        <div class="brand-mark">R</div>
        <div>
          <div class="brand-name">${companyName}</div>
          <div class="brand-sub">FMCG · Spices · Foods</div>
        </div>
      </div>
      <div class="brand-addr">${companyAddress}</div>
      <div class="brand-meta">GSTIN: ${companyGst} · FSSAI: ${companyFssai}</div>
    </div>
    <div class="invoice-meta">
      <div class="invoice-label">Invoice</div>
      <div class="invoice-no">${invoice.invoiceNo}</div>
      <div class="invoice-date">Issued: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}</div>
      <div class="invoice-date">Due: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : '—'}</div>
      <div class="invoice-status">${invoice.status}</div>
    </div>
  </div>

  <div class="parties">
    <div class="party-box">
      <div class="party-label">Billed To</div>
      <div class="party-name">${invoice.customer.businessName}</div>
      ${invoice.customer.ownerName ? `<div class="party-line">${invoice.customer.ownerName}</div>` : ''}
      <div class="party-line">${invoice.customer.address}</div>
      <div class="party-line">${invoice.customer.area}, ${invoice.customer.district} ${invoice.customer.pin ?? ''}</div>
      <div class="party-line">Phone: ${invoice.customer.phone}</div>
      ${invoice.customer.gst ? `<div class="party-line">GSTIN: ${invoice.customer.gst}</div>` : ''}
    </div>
    <div class="party-box">
      <div class="party-label">Order Details</div>
      <div class="party-line">Order: ${invoice.order.orderNo}</div>
      <div class="party-line">Salesman: ${invoice.order.salesman?.name ?? '—'}</div>
      <div class="party-line">Channel: ${invoice.order.channel}</div>
      <div class="party-line">Items: ${invoice.order.itemsCount}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Item</th>
        <th>HSN</th>
        <th>Qty</th>
        <th>Rate</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.order.items.map((it, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>
            <div style="font-weight:600">${it.product.name}</div>
            <div style="font-size:11px;color:#888">${it.product.sku} · ${it.product.packagingSize ?? ''}</div>
          </td>
          <td>${it.product.hsn ?? '—'}</td>
          <td>${it.quantity}</td>
          <td>₹${it.unitPrice.toFixed(2)}</td>
          <td>₹${it.total.toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="total-row"><span>Subtotal</span><span>₹${invoice.subtotal.toFixed(2)}</span></div>
    <div class="total-row"><span>GST (5%)</span><span>₹${invoice.tax.toFixed(2)}</span></div>
    <div class="total-row grand"><span>Total</span><span>₹${invoice.total.toFixed(2)}</span></div>
    <div class="total-row paid"><span>Paid</span><span>₹${invoice.paid.toFixed(2)}</span></div>
    <div class="total-row balance"><span>Balance Due</span><span>₹${invoice.balance.toFixed(2)}</span></div>
  </div>

  <div class="footer">
    <div class="footer-note">
      <strong>Terms & Conditions:</strong> Payment due within 15 days of invoice date. Goods once sold are not returnable except for quality issues — claim within 48 hours of delivery. Subject to Gorakhpur jurisdiction.
    </div>
    <div class="footer-thanks">Thank you for your business!</div>
  </div>

  <div class="signature">
    <div class="signature-line">Authorised Signatory · ${companyName}</div>
  </div>

  <script>
    window.onload = () => { setTimeout(() => window.print(), 300); }
  </script>
</body>
</html>`

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
