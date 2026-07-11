import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Return an order — reverse stock, create credit note
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { reason } = await req.json()
    const order = await db.salesOrder.findUnique({
      where: { id },
      include: { items: true, customer: true },
    })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.status === 'returned') return NextResponse.json({ error: 'Already returned' }, { status: 400 })
    if (order.status === 'cancelled') return NextResponse.json({ error: 'Cannot return cancelled order' }, { status: 400 })

    const wh = await db.warehouse.findFirst({ orderBy: { createdAt: 'asc' } })
    if (!wh) return NextResponse.json({ error: 'No warehouse' }, { status: 400 })

    const result = await db.$transaction(async (tx) => {
      // Restore stock
      for (const item of order.items) {
        await tx.inventory.update({
          where: { productId_warehouseId: { productId: item.productId, warehouseId: wh.id } },
          data: { currentStock: { increment: item.quantity } },
        })
        await tx.stockMovement.create({
          data: {
            productId: item.productId, warehouseId: wh.id,
            type: 'return', quantity: item.quantity,
            refType: 'sales', refId: order.id,
            note: `Return: ${order.orderNo} - ${reason || 'customer return'}`,
          },
        })
      }
      // Update order status
      const updated = await tx.salesOrder.update({
        where: { id },
        data: { status: 'returned' },
      })
      // Create credit note invoice
      const invCount = await tx.invoice.count()
      await tx.invoice.create({
        data: {
          invoiceNo: `CN-2026-${String(invCount + 1).padStart(4, '0')}`,
          orderId: order.id,
          customerId: order.customerId,
          type: 'credit_note',
          subtotal: -order.subtotal,
          tax: -order.tax,
          total: -order.total,
          paid: 0,
          balance: -order.total,
          status: 'paid',
          dueDate: new Date(),
        },
      })
      // Reduce customer outstanding if there was credit
      if (order.paid < order.total) {
        await tx.customer.update({
          where: { id: order.customerId },
          data: { outstanding: { decrement: (order.total - order.paid) } },
        })
      }
      // Timeline entry
      await tx.timelineEntry.create({
        data: {
          customerId: order.customerId, type: 'order',
          title: `Order returned: ${order.orderNo}`,
          body: reason || 'Customer return',
        },
      })
      await tx.auditLog.create({
        data: { action: 'return', entity: 'sales_order', entityId: id, newValue: JSON.stringify({ reason }) },
      })
      return updated
    })
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
