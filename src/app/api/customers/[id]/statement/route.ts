import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * Returns a printable customer statement with all orders, payments, and outstanding balance.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      salesman: { select: { name: true } },
      salesOrders: {
        orderBy: { createdAt: 'asc' },
        include: { items: { select: { id: true } } },
      },
      payments: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const settings = await db.setting.findMany()
  const settingMap = Object.fromEntries(settings.map((s) => [s.key, s.value]))
  const companyName = settingMap.company_name ?? 'Rise Foods'
  const companyAddress = settingMap.company_address ?? 'Betiahata Industrial Area, Gorakhpur, UP 273001'

  // Build running ledger
  type LedgerEntry = { date: string; type: 'order' | 'payment'; ref: string; debit: number; credit: number; balance: number }
  const ledger: LedgerEntry[] = []
  let runningBalance = 0
  const allOrders = customer.salesOrders.filter((o) => o.status !== 'cancelled')
  const allPayments = customer.payments.filter((p) => p.status === 'completed')
  const events = [
    ...allOrders.map((o) => ({ date: new Date(o.createdAt), type: 'order' as const, ref: o.orderNo, amount: o.total })),
    ...allPayments.map((p) => ({ date: new Date(p.createdAt), type: 'payment' as const, ref: p.paymentNo, amount: p.amount })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime())
  for (const e of events) {
    if (e.type === 'order') runningBalance += e.amount
    else runningBalance -= e.amount
    ledger.push({
      date: e.date.toLocaleDateString('en-IN'),
      type: e.type, ref: e.ref,
      debit: e.type === 'order' ? e.amount : 0,
      credit: e.type === 'payment' ? e.amount : 0,
      balance: +runningBalance.toFixed(2),
    })
  }

  const totalBilled = allOrders.reduce((s, o) => s + o.total, 0)
  const totalPaid = allPayments.reduce((s, p) => s + p.amount, 0)

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Statement — ${customer.businessName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', -apple-system, sans-serif; color: #1a1a1a; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid #f97316; margin-bottom: 24px; }
    .brand-name { font-size: 22px; font-weight: 700; }
    .brand-addr { font-size: 11px; color: #666; margin-top: 6px; line-height: 1.5; }
    .title { font-size: 24px; font-weight: 700; color: #f97316; text-align: right; }
    .subtitle { font-size: 11px; color: #666; text-align: right; text-transform: uppercase; letter-spacing: 1px; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .party-box { padding: 16px; background: #f9fafb; border-radius: 8px; }
    .party-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; font-weight: 600; }
    .party-name { font-size: 14px; font-weight: 600; }
    .party-line { font-size: 12px; color: #555; margin-top: 2px; line-height: 1.5; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .summary-box { padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; text-align: center; }
    .summary-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
    .summary-value { font-size: 16px; font-weight: 700; margin-top: 4px; }
    .summary-value.danger { color: #dc2626; }
    .summary-value.success { color: #16a34a; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #f3f4f6; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #555; font-weight: 600; }
    th:nth-child(n+3) { text-align: right; }
    td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
    td:nth-child(n+3) { text-align: right; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
    .badge-order { background: #fef3c7; color: #d97706; }
    .badge-payment { background: #dcfce7; color: #16a34a; }
    .footer { padding-top: 20px; border-top: 1px solid #e5e7eb; margin-top: 30px; font-size: 11px; color: #666; line-height: 1.6; text-align: center; }
    @media print { body { padding: 20px; } @page { margin: 1.5cm; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand-name">${companyName}</div>
      <div class="brand-addr">${companyAddress}</div>
    </div>
    <div>
      <div class="title">Account Statement</div>
      <div class="subtitle">As of ${new Date().toLocaleDateString('en-IN')}</div>
    </div>
  </div>

  <div class="parties">
    <div class="party-box">
      <div class="party-label">Customer</div>
      <div class="party-name">${customer.businessName}</div>
      ${customer.ownerName ? `<div class="party-line">${customer.ownerName}</div>` : ''}
      <div class="party-line">${customer.address}</div>
      <div class="party-line">${customer.area}, ${customer.district} ${customer.pin ?? ''}</div>
      <div class="party-line">Phone: ${customer.phone}</div>
      ${customer.gst ? `<div class="party-line">GSTIN: ${customer.gst}</div>` : ''}
    </div>
    <div class="party-box">
      <div class="party-label">Account Summary</div>
      <div class="party-line">Salesman: ${customer.salesman?.name ?? '—'}</div>
      <div class="party-line">Customer Since: ${new Date(customer.createdAt).toLocaleDateString('en-IN')}</div>
      <div class="party-line">Credit Limit: ₹${customer.creditLimit.toLocaleString('en-IN')}</div>
      <div class="party-line">Credit Days: ${customer.creditDays} days</div>
      <div class="party-line">Status: <strong style="text-transform:uppercase">${customer.status}</strong></div>
    </div>
  </div>

  <div class="summary">
    <div class="summary-box">
      <div class="summary-label">Total Billed</div>
      <div class="summary-value">₹${totalBilled.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
    </div>
    <div class="summary-box">
      <div class="summary-label">Total Paid</div>
      <div class="summary-value success">₹${totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
    </div>
    <div class="summary-box">
      <div class="summary-label">Outstanding</div>
      <div class="summary-value danger">₹${customer.outstanding.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
    </div>
    <div class="summary-box">
      <div class="summary-label">Lifetime Value</div>
      <div class="summary-value">₹${customer.lifetimeValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Type</th>
        <th>Reference</th>
        <th>Debit</th>
        <th>Credit</th>
        <th>Balance</th>
      </tr>
    </thead>
    <tbody>
      ${ledger.length === 0 ? '<tr><td colspan="6" style="text-align:center;padding:24px;color:#888">No transactions yet</td></tr>' : ledger.map((e) => `
        <tr>
          <td>${e.date}</td>
          <td><span class="badge ${e.type === 'order' ? 'badge-order' : 'badge-payment'}">${e.type}</span></td>
          <td>${e.ref}</td>
          <td>${e.debit > 0 ? '₹' + e.debit.toFixed(2) : '—'}</td>
          <td>${e.credit > 0 ? '₹' + e.credit.toFixed(2) : '—'}</td>
          <td><strong>₹${e.balance.toFixed(2)}</strong></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    This statement is computer-generated and reflects transactions recorded in the Rise Foods ERP system as of ${new Date().toLocaleString('en-IN')}.<br>
    For any discrepancies, please contact accounts@risefoods.in within 7 days.
  </div>

  <script>window.onload = () => setTimeout(() => window.print(), 300);</script>
</body>
</html>`

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
