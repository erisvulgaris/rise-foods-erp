import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await db.salesOrder.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, businessName: true, phone: true, area: true, district: true } },
      salesman: { select: { id: true, name: true } },
      items: { include: { product: { select: { id: true, name: true, sku: true, packagingSize: true } } } },
      invoices: true,
      payments: true,
      dispatch: true,
    },
  })
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(order)
}

const FLOW: Record<string, string | null> = {
  pending: 'packed', packed: 'dispatched', dispatched: 'delivered',
  delivered: null, cancelled: null,
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { action } = body as { action: 'advance' | 'cancel' | 'reopen' }

    const order = await db.salesOrder.findUnique({ where: { id } })
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (action === 'cancel') {
      if (order.status === 'cancelled') return NextResponse.json({ error: 'Already cancelled' }, { status: 400 })
      // Restore stock
      const items = await db.salesOrderItem.findMany({ where: { soId: id } })
      const wh = await db.warehouse.findFirst({ orderBy: { createdAt: 'asc' } })
      if (wh) {
        for (const it of items) {
          await db.inventory.update({
            where: { productId_warehouseId: { productId: it.productId, warehouseId: wh.id } },
            data: { currentStock: { increment: it.quantity } },
          })
          await db.stockMovement.create({ data: { productId: it.productId, warehouseId: wh.id, type: 'return', quantity: it.quantity, refType: 'sales', refId: id, note: `Cancelled SO ${order.orderNo}` } })
        }
      }
      const updated = await db.salesOrder.update({ where: { id }, data: { status: 'cancelled', cancelledAt: new Date() } })
      // Reverse outstanding if credit was given
      if (order.paid < order.total) {
        await db.customer.update({ where: { id: order.customerId }, data: { outstanding: { decrement: (order.total - order.paid) } } })
      }
      await db.auditLog.create({ data: { action: 'cancel', entity: 'sales_order', entityId: id } })
      return NextResponse.json(updated)
    }

    if (action === 'advance') {
      const next = FLOW[order.status]
      if (!next) return NextResponse.json({ error: `Cannot advance from ${order.status}` }, { status: 400 })
      const updates: any = { status: next }
      if (next === 'packed') updates.packedAt = new Date()
      if (next === 'dispatched') {
        updates.packedAt = updates.packedAt ?? order.packedAt ?? new Date()
        updates.dispatchedAt = new Date()
        // Create dispatch record
        const dspCount = await db.dispatch.count()
        await db.dispatch.create({ data: { dispatchNo: `DSP-2026-${String(dspCount + 1).padStart(4, '0')}`, orderId: id, driverName: 'Kamlesh Yadav', driverPhone: '+919876543220', status: 'in_transit', loadedAt: new Date() } })
      }
      if (next === 'delivered') updates.deliveredAt = new Date()
      const updated = await db.salesOrder.update({ where: { id }, data: updates })
      await db.timelineEntry.create({ data: { customerId: order.customerId, type: next === 'delivered' ? 'order' : 'visit', title: `Order ${next}`, body: `${order.orderNo} marked as ${next}`, createdBy: null } })
      await db.auditLog.create({ data: { action: 'update', entity: 'sales_order', entityId: id, newValue: JSON.stringify({ status: next }) } })
      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
