import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const DAY = 86400000
const startOfDayAgo = (n: number) => {
  const d = new Date(Date.now() - n * DAY)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/**
 * Analyzes real-time business data and generates AI insights.
 * Each insight follows the pattern: observation → reason → recommendation.
 */
export async function POST() {
  const generated: any[] = []

  const [orders, products, customers, inventory, batches, payments, expenses, pos] = await Promise.all([
    db.salesOrder.findMany({ where: { status: { not: 'cancelled' } }, include: { customer: { select: { id: true, businessName: true, area: true } } }, orderBy: { createdAt: 'asc' } }),
    db.product.findMany(),
    db.customer.findMany({ include: { salesman: { select: { id: true, name: true } } } }),
    db.inventory.findMany({ include: { product: { select: { id: true, name: true, sku: true, abcClass: true, packagingSize: true, reorderLevel: true, costPrice: true } } } }),
    db.batch.findMany({ include: { product: { select: { id: true, name: true, sku: true } } } }),
    db.payment.findMany({ where: { status: 'completed' } }),
    db.expense.findMany(),
    db.purchaseOrder.findMany(),
  ])

  // ─── 1. Sales trend (week-over-week) ───
  const weekStart = startOfDayAgo(7)
  const twoWeekStart = startOfDayAgo(14)
  const thisWeekRev = orders.filter((o) => new Date(o.createdAt) >= weekStart).reduce((s, o) => s + o.total, 0)
  const lastWeekRev = orders.filter((o) => new Date(o.createdAt) >= twoWeekStart && new Date(o.createdAt) < weekStart).reduce((s, o) => s + o.total, 0)
  const deltaPct = lastWeekRev > 0 ? ((thisWeekRev - lastWeekRev) / lastWeekRev) * 100 : 0
  if (Math.abs(deltaPct) > 5) {
    // Top mover vs worst mover
    const byProduct = new Map<string, { name: string; rev: number }>()
    const soItems = await db.salesOrderItem.findMany({ where: { so: { status: { not: 'cancelled' }, createdAt: { gte: twoWeekStart } } }, include: { product: { select: { id: true, name: true } } } })
    for (const it of soItems) {
      const cur = byProduct.get(it.productId) ?? { name: it.product.name, rev: 0 }
      cur.rev += it.total
      byProduct.set(it.productId, cur)
    }
    const ranked = [...byProduct.entries()].sort((a, b) => b[1].rev - a[1].rev)
    const topMover = ranked[0]?.[1].name
    const bottomMover = ranked[ranked.length - 1]?.[1].name
    generated.push({
      type: deltaPct < 0 ? 'trend' : 'success',
      category: 'sales',
      title: `Sales ${deltaPct < 0 ? 'dropped' : 'grew'} ${Math.abs(deltaPct).toFixed(1)}% this week`,
      body: `Weekly revenue moved from ₹${lastWeekRev.toLocaleString('en-IN', { maximumFractionDigits: 0 })} to ₹${thisWeekRev.toLocaleString('en-IN', { maximumFractionDigits: 0 })}. ${deltaPct < 0 ? 'Primary drag: ' + (bottomMover ?? 'mixed SKUs') : 'Primary driver: ' + (topMover ?? 'mixed SKUs')}.`,
      severity: deltaPct < -10 ? 'critical' : deltaPct < 0 ? 'warning' : 'success',
      metric: 'weekly_revenue',
      metricValue: +thisWeekRev.toFixed(2),
      deltaPercent: +deltaPct.toFixed(2),
      recommendation: deltaPct < 0
        ? `Schedule sales visits to top 5 ${bottomMover ?? 'lagging'} retailers. Run a 5% volume discount to boost turnover.`
        : `Maintain current cadence. Consider increasing ${topMover ?? 'top SKU'} procurement by 15% to capture demand.`,
    })
  }

  // ─── 2. Inventory reorder recommendations (sales velocity based) ───
  const last30Orders = orders.filter((o) => new Date(o.createdAt) >= startOfDayAgo(30))
  const productSalesLast30 = new Map<string, number>()
  const soItems30 = await db.salesOrderItem.findMany({ where: { so: { status: { not: 'cancelled' }, createdAt: { gte: startOfDayAgo(30) } } } })
  for (const it of soItems30) productSalesLast30.set(it.productId, (productSalesLast30.get(it.productId) ?? 0) + it.quantity)
  for (const inv of inventory) {
    const totalStock = inv.currentStock + inv.incomingStock
    const dailyVelocity = (productSalesLast30.get(inv.productId) ?? 0) / 30
    const daysOfCover = dailyVelocity > 0 ? totalStock / dailyVelocity : 999
    if (inv.currentStock <= inv.reorderLevel) {
      const suggestedQty = Math.max(inv.reorderLevel * 3, Math.ceil(dailyVelocity * 30))
      generated.push({
        type: 'recommendation',
        category: 'inventory',
        title: `Reorder ${inv.product.name}`,
        body: `Current stock: ${inv.currentStock} (reorder level ${inv.reorderLevel}). Daily velocity: ${dailyVelocity.toFixed(1)} units/day. Days of cover: ${daysOfCover.toFixed(0)} days.`,
        severity: daysOfCover < 7 ? 'critical' : 'warning',
        metric: 'days_of_cover',
        metricValue: +daysOfCover.toFixed(0),
        refType: 'product', refId: inv.productId,
        recommendation: `Place PO for ${suggestedQty} units (~30 days cover). Lead time buffer should be considered.`,
      })
    }
  }

  // ─── 3. Expiry alerts ───
  const expirySoon = batches.filter((b) => {
    const days = Math.ceil((new Date(b.expiryDate).getTime() - Date.now()) / DAY)
    return days >= 0 && days <= 30
  }).sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
  if (expirySoon.length > 0) {
    const b = expirySoon[0]
    const days = Math.ceil((new Date(b.expiryDate).getTime() - Date.now()) / DAY)
    generated.push({
      type: 'risk',
      category: 'inventory',
      title: `Batch expiring in ${days} days`,
      body: `${b.batchNo} (${b.product.name}) — ${b.quantity} units expire on ${new Date(b.expiryDate).toLocaleDateString('en-IN')}.`,
      severity: days < 7 ? 'critical' : 'warning',
      metric: 'days_to_expiry',
      metricValue: days,
      refType: 'batch', refId: b.id,
      recommendation: `Run a clearance promo at 10–15% discount. Prioritize dispatch of this batch via FIFO.`,
    })
  }

  // ─── 4. Customer churn risk ───
  const inactiveCustomers = customers.filter((c) => {
    if (!c.lastOrderAt || c.status !== 'active') return false
    const daysSince = (Date.now() - new Date(c.lastOrderAt).getTime()) / DAY
    return daysSince > 21
  }).sort((a, b) => new Date(a.lastOrderAt!).getTime() - new Date(b.lastOrderAt!).getTime())
  if (inactiveCustomers.length > 0) {
    const c = inactiveCustomers[0]
    const days = Math.floor((Date.now() - new Date(c.lastOrderAt!).getTime()) / DAY)
    generated.push({
      type: 'risk',
      category: 'customer',
      title: `Top customer inactive ${days} days`,
      body: `${c.businessName} (LTV ₹${c.lifetimeValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}, ${c.area}) has not ordered in ${days} days. Churn risk elevated.`,
      severity: days > 30 ? 'critical' : 'warning',
      metric: 'days_inactive',
      metricValue: days,
      refType: 'customer', refId: c.id,
      recommendation: `${c.salesman?.name ?? 'Salesman'} to visit within 48 hrs. Offer ₹500 credit note as goodwill gesture.`,
    })
  }

  // ─── 5. Cash flow risk ───
  const totalOutstanding = customers.reduce((s, c) => s + c.outstanding, 0)
  const totalCash = (await db.bankAccount.aggregate({ _sum: { balance: true } }))._sum.balance ?? 0
  const overdueInvoices = await db.invoice.findMany({ where: { status: 'overdue' } })
  if (totalOutstanding > totalCash * 0.8 || overdueInvoices.length > 2) {
    const topOverdue = overdueInvoices.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0]
    generated.push({
      type: 'risk',
      category: 'finance',
      title: 'Cash flow risk detected',
      body: `Outstanding ₹${totalOutstanding.toLocaleString('en-IN', { maximumFractionDigits: 0 })} vs available cash ₹${totalCash.toLocaleString('en-IN', { maximumFractionDigits: 0 })}. ${overdueInvoices.length} invoices overdue > 30 days.`,
      severity: 'critical',
      metric: 'cash_flow_gap',
      metricValue: +(totalOutstanding - totalCash).toFixed(2),
      recommendation: `Prioritize collection from top overdue customers. Total ₹${overdueInvoices.reduce((s, i) => s + i.balance, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })} recoverable.`,
    })
  }

  // ─── 6. Profit margin trend ───
  const recentOrders = orders.filter((o) => new Date(o.createdAt) >= startOfDayAgo(30))
  const recentMargin = recentOrders.length ? (recentOrders.reduce((s, o) => s + o.profit, 0) / recentOrders.reduce((s, o) => s + o.total, 0)) * 100 : 0
  const olderOrders = orders.filter((o) => new Date(o.createdAt) >= startOfDayAgo(60) && new Date(o.createdAt) < startOfDayAgo(30))
  const olderMargin = olderOrders.length ? (olderOrders.reduce((s, o) => s + o.profit, 0) / olderOrders.reduce((s, o) => s + o.total, 0)) * 100 : 0
  const marginDelta = olderMargin > 0 ? recentMargin - olderMargin : 0
  if (Math.abs(marginDelta) > 1) {
    generated.push({
      type: marginDelta > 0 ? 'success' : 'anomaly',
      category: 'finance',
      title: `Profit margin ${marginDelta > 0 ? 'improved' : 'declined'} ${Math.abs(marginDelta).toFixed(1)} pts`,
      body: `Gross margin moved from ${olderMargin.toFixed(1)}% to ${recentMargin.toFixed(1)}% in the last 30 days.`,
      severity: marginDelta < -2 ? 'critical' : marginDelta < 0 ? 'warning' : 'success',
      metric: 'gross_margin',
      metricValue: +recentMargin.toFixed(2),
      deltaPercent: +marginDelta.toFixed(2),
      recommendation: marginDelta < 0
        ? `Review pricing on low-margin SKUs. Consider supplier renegotiation or pass-through price increase.`
        : `Margin trajectory healthy. Maintain pricing discipline and prioritize high-margin SKUs in sales pitches.`,
    })
  }

  // ─── 7. Inventory turnover ───
  const inventoryValue = inventory.reduce((s, i) => s + i.valuation, 0)
  const cogs30 = soItems30.reduce((s, it) => s + it.unitCost * it.quantity, 0)
  const turnoverRatio = inventoryValue > 0 ? (cogs30 / inventoryValue) * 12 : 0  // annualized
  generated.push({
    type: 'info',
    category: 'inventory',
    title: `Inventory turnover: ${turnoverRatio.toFixed(1)}x annualized`,
    body: `Based on ₹${cogs30.toLocaleString('en-IN', { maximumFractionDigits: 0 })} COGS in last 30 days vs ₹${inventoryValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })} inventory value.`,
    severity: turnoverRatio < 4 ? 'warning' : 'success',
    metric: 'turnover_ratio',
    metricValue: +turnoverRatio.toFixed(2),
    recommendation: turnoverRatio < 4
      ? `Slow turnover — reduce procurement of slow-moving SKUs. Run clearance on aging stock.`
      : `Healthy turnover. Maintain current procurement cadence.`,
  })

  // ─── 8. Top supplier performance ───
  const supplierAgg = new Map<string, { name: string; onTime: number; orders: number }>()
  for (const po of pos) {
    const s = await db.supplier.findUnique({ where: { id: po.supplierId } })
    if (!s) continue
    const cur = supplierAgg.get(s.id) ?? { name: s.name, onTime: s.onTimeRate, orders: 0 }
    cur.orders += 1
    supplierAgg.set(s.id, cur)
  }
  const worstSupplier = [...supplierAgg.entries()].sort((a, b) => a[1].onTime - b[1].onTime)[0]
  if (worstSupplier && worstSupplier[1].onTime < 80) {
    generated.push({
      type: 'risk',
      category: 'procurement',
      title: `Supplier performance risk: ${worstSupplier[1].name}`,
      body: `On-time delivery rate: ${worstSupplier[1].onTime.toFixed(0)}% across ${worstSupplier[1].orders} POs. Below 80% threshold.`,
      severity: 'warning',
      metric: 'on_time_rate',
      metricValue: worstSupplier[1].onTime,
      recommendation: `Schedule a call to discuss SLAs. Consider adding backup suppliers for critical SKUs sourced from this vendor.`,
    })
  }

  // ─── 9. Daily collection performance ───
  const todayStart = startOfDayAgo(0)
  const todayCollection = payments.filter((p) => new Date(p.createdAt) >= todayStart).reduce((s, p) => s + p.amount, 0)
  const avgDailyCollection = payments.filter((p) => new Date(p.createdAt) >= startOfDayAgo(7)).reduce((s, p) => s + p.amount, 0) / 7
  const collectionDelta = avgDailyCollection > 0 ? ((todayCollection - avgDailyCollection) / avgDailyCollection) * 100 : 0
  generated.push({
    type: 'info',
    category: 'finance',
    title: `Today's collection: ₹${todayCollection.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
    body: `vs 7-day average of ₹${avgDailyCollection.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/day (${collectionDelta > 0 ? '+' : ''}${collectionDelta.toFixed(1)}%).`,
    severity: collectionDelta < -20 ? 'warning' : 'info',
    metric: 'daily_collection',
    metricValue: +todayCollection.toFixed(2),
    deltaPercent: +collectionDelta.toFixed(2),
    recommendation: collectionDelta < 0
      ? `Below-average collection day. Salesmen should prioritize follow-ups with top overdue accounts.`
      : `Strong collection day. Continue momentum.`,
  })

  // Persist insights to DB (replace existing generated ones)
  await db.aIInsight.deleteMany({})
  for (const ins of generated) {
    await db.aIInsight.create({ data: ins })
  }

  return NextResponse.json({ generated: generated.length, insights: generated })
}
