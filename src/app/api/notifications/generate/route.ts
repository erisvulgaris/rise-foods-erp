import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const DAY = 86400000

/**
 * Scans the database and generates notifications for:
 * - Low stock
 * - Expiring batches
 * - Overdue payments
 * - Inactive customers
 * - Pending orders needing action
 */
export async function POST() {
  let created = 0
  const since = new Date(Date.now() - 24 * 3600 * 1000)  // avoid re-creating within last 24h

  // 1. Low stock
  const lowStock = await db.inventory.findMany({
    where: { currentStock: { lte: db.inventory.fields.reorderLevel } },
    include: { product: { select: { id: true, name: true, sku: true, reorderLevel: true } } },
  })
  for (const inv of lowStock) {
    const existing = await db.notification.findFirst({
      where: { type: 'low_stock', refId: inv.productId, createdAt: { gte: since } },
    })
    if (!existing) {
      await db.notification.create({
        data: {
          type: 'low_stock',
          title: `Low stock: ${inv.product.name}`,
          body: `Only ${inv.currentStock} units left (reorder level: ${inv.product.reorderLevel}). Suggested PO: ${inv.product.reorderLevel * 3} units.`,
          severity: inv.currentStock <= inv.product.reorderLevel / 2 ? 'critical' : 'warning',
          refType: 'product', refId: inv.productId,
        },
      })
      created++
    }
  }

  // 2. Expiring batches
  const expiringBatches = await db.batch.findMany({
    where: {
      status: 'in_stock',
      expiryDate: { lte: new Date(Date.now() + 30 * DAY), gte: new Date() },
    },
    include: { product: { select: { id: true, name: true } } },
  })
  for (const b of expiringBatches) {
    const existing = await db.notification.findFirst({
      where: { type: 'inventory_expiry', refId: b.id, createdAt: { gte: since } },
    })
    if (!existing) {
      const days = Math.ceil((new Date(b.expiryDate).getTime() - Date.now()) / DAY)
      await db.notification.create({
        data: {
          type: 'inventory_expiry',
          title: `Batch expiring in ${days} days`,
          body: `${b.batchNo} (${b.product.name}) — ${b.quantity} units expire on ${new Date(b.expiryDate).toLocaleDateString('en-IN')}.`,
          severity: days < 7 ? 'critical' : 'warning',
          refType: 'batch', refId: b.id,
        },
      })
      created++
    }
  }

  // 3. Overdue invoices
  const overdueInvoices = await db.invoice.findMany({
    where: { status: 'overdue', balance: { gt: 0 } },
    include: { customer: { select: { id: true, businessName: true } } },
  })
  if (overdueInvoices.length > 0) {
    const existing = await db.notification.findFirst({
      where: { type: 'pending_payment', createdAt: { gte: since } },
    })
    if (!existing) {
      const totalOverdue = overdueInvoices.reduce((s, i) => s + i.balance, 0)
      await db.notification.create({
        data: {
          type: 'pending_payment',
          title: `${overdueInvoices.length} invoices overdue`,
          body: `Total ₹${totalOverdue.toLocaleString('en-IN', { maximumFractionDigits: 0 })} overdue across ${overdueInvoices.length} customers. Top: ${overdueInvoices[0].customer.businessName}.`,
          severity: 'critical',
          refType: 'invoice', refId: overdueInvoices[0].id,
        },
      })
      created++
    }
  }

  // 4. Inactive customers (>21 days, active status)
  const inactiveCustomers = await db.customer.findMany({
    where: {
      status: 'active',
      lastOrderAt: { lt: new Date(Date.now() - 21 * DAY) },
    },
  })
  if (inactiveCustomers.length > 0) {
    const existing = await db.notification.findFirst({
      where: { type: 'customer_inactive', createdAt: { gte: since } },
    })
    if (!existing) {
      await db.notification.create({
        data: {
          type: 'customer_inactive',
          title: `${inactiveCustomers.length} customers inactive >21 days`,
          body: `Top at-risk: ${inactiveCustomers[0].businessName} (last order ${inactiveCustomers[0].lastOrderAt ? new Date(inactiveCustomers[0].lastOrderAt).toLocaleDateString('en-IN') : 'N/A'}).`,
          severity: 'warning',
          refType: 'customer', refId: inactiveCustomers[0].id,
        },
      })
      created++
    }
  }

  // 5. Pending orders (older than 24h)
  const pendingOrders = await db.salesOrder.findMany({
    where: { status: 'pending', createdAt: { lt: since } },
    include: { customer: { select: { id: true, businessName: true } } },
  })
  if (pendingOrders.length > 0) {
    const existing = await db.notification.findFirst({
      where: { type: 'new_order', createdAt: { gte: since } },
    })
    if (!existing) {
      await db.notification.create({
        data: {
          type: 'new_order',
          title: `${pendingOrders.length} pending orders need processing`,
          body: `Oldest: ${pendingOrders[0].orderNo} from ${pendingOrders[0].customer.businessName}.`,
          severity: 'info',
          refType: 'sales_order', refId: pendingOrders[0].id,
        },
      })
      created++
    }
  }

  return NextResponse.json({ created, total: await db.notification.count() })
}
