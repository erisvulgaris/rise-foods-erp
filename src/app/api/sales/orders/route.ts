import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function GET() {
  const orders = await db.salesOrder.findMany({
    include: {
      customer: { select: { id: true, businessName: true, phone: true, area: true, district: true } },
      salesman: { select: { id: true, name: true } },
      items: { include: { product: { select: { id: true, name: true, sku: true, packagingSize: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(orders)
}

const itemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  unitCost: z.number().min(0),
  taxPercent: z.number().min(0).default(5),
  discount: z.number().min(0).default(0),
})

const createSchema = z.object({
  customerId: z.string(),
  salesmanId: z.string().optional().nullable(),
  items: z.array(itemSchema).min(1),
  discount: z.number().min(0).default(0),
  channel: z.string().default('direct'),
  notes: z.string().optional().nullable(),
  paymentMethod: z.enum(['cash', 'upi', 'bank', 'cheque', 'credit']).optional(),
  paymentReference: z.string().optional().nullable(),
  paidNow: z.number().min(0).optional().default(0),
  createdBy: z.string().optional().nullable(),
  warehouseId: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    // Validate stock availability
    const warehouseId = data.warehouseId ?? (await db.warehouse.findFirst({ orderBy: { createdAt: 'asc' } }))?.id
    if (!warehouseId) return NextResponse.json({ error: 'No warehouse found' }, { status: 400 })

    const stockChecks = await Promise.all(data.items.map(async (it) => {
      const inv = await db.inventory.findUnique({ where: { productId_warehouseId: { productId: it.productId, warehouseId } } })
      return { item: it, available: inv?.currentStock ?? 0 }
    }))
    const insufficient = stockChecks.find((c) => c.available < c.item.quantity)
    if (insufficient) {
      return NextResponse.json({ error: `Insufficient stock for product ${insufficient.item.productId}. Available: ${insufficient.available}, Requested: ${insufficient.item.quantity}` }, { status: 400 })
    }

    // Credit check (non-blocking warning)
    const customer = await db.customer.findUnique({ where: { id: data.customerId } })
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 400 })

    // Calculate totals
    let subtotal = 0
    let profit = 0
    const itemsData = data.items.map((it) => {
      const total = +(it.quantity * it.unitPrice * (1 - (it.discount || 0) / 100)).toFixed(2)
      const lineProfit = +((it.unitPrice - it.unitCost) * it.quantity).toFixed(2)
      subtotal += total
      profit += lineProfit
      return {
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        unitCost: it.unitCost,
        taxPercent: it.taxPercent,
        discount: it.discount,
        total,
        profit: lineProfit,
      }
    })
    const afterDiscount = subtotal - data.discount
    const tax = +(afterDiscount * 0.05).toFixed(2)
    const total = +(afterDiscount + tax).toFixed(2)
    const paidNow = data.paidNow ?? 0

    // Generate order/invoice numbers
    const orderCount = await db.salesOrder.count()
    const orderNo = `SO-2026-${String(orderCount + 1).padStart(4, '0')}`
    const invCount = await db.invoice.count()
    const invoiceNo = `INV-2026-${String(invCount + 1).padStart(4, '0')}`
    const payCount = await db.payment.count()
    const paymentNo = `PAY-2026-${String(payCount + 1).padStart(4, '0')}`

    // Create order + items + invoice + payment + stock movements in a transaction
    const result = await db.$transaction(async (tx) => {
      const order = await tx.salesOrder.create({
        data: {
          orderNo,
          customerId: data.customerId,
          salesmanId: data.salesmanId || null,
          status: 'pending',
          paymentStatus: paidNow >= total ? 'paid' : paidNow > 0 ? 'partial' : 'unpaid',
          subtotal: +subtotal.toFixed(2),
          tax,
          discount: data.discount,
          total,
          paid: paidNow,
          profit: +profit.toFixed(2),
          itemsCount: data.items.length,
          channel: data.channel,
          notes: data.notes || null,
          createdBy: data.createdBy || null,
          deliveryAddress: customer.address,
          items: { create: itemsData },
        },
        include: { items: true, customer: { select: { id: true, businessName: true, phone: true, area: true, district: true } } },
      })

      // Create invoice
      const dueDate = new Date(Date.now() + (customer.creditDays || 15) * 86400000)
      const invoice = await tx.invoice.create({
        data: {
          invoiceNo,
          orderId: order.id,
          customerId: data.customerId,
          type: 'sales',
          subtotal: +subtotal.toFixed(2),
          tax,
          total,
          paid: paidNow,
          balance: +(total - paidNow).toFixed(2),
          status: paidNow >= total ? 'paid' : paidNow > 0 ? 'partial' : 'unpaid',
          dueDate,
        },
      })

      // Record payment if any
      if (paidNow > 0 && data.paymentMethod) {
        await tx.payment.create({
          data: {
            paymentNo,
            orderId: order.id,
            invoiceId: invoice.id,
            customerId: data.customerId,
            amount: paidNow,
            method: data.paymentMethod,
            reference: data.paymentReference || null,
            status: 'completed',
            collectedBy: data.createdBy || null,
          },
        })
        // Reduce customer outstanding
        await tx.customer.update({
          where: { id: data.customerId },
          data: {
            outstanding: { increment: Math.max(0, total - paidNow) },
            lastPaymentAt: new Date(),
          },
        })
      } else {
        // Full credit — add to outstanding
        await tx.customer.update({
          where: { id: data.customerId },
          data: { outstanding: { increment: total }, lastOrderAt: new Date() },
        })
      }
      // Always update lastOrderAt + lifetimeValue + avgOrderValue + orderFrequency
      const newLifetimeValue = customer.lifetimeValue + total
      const newOrderCount = customer.orderFrequency + 1
      await tx.customer.update({
        where: { id: data.customerId },
        data: {
          lastOrderAt: new Date(),
          lifetimeValue: newLifetimeValue,
          profitGenerated: { increment: +profit.toFixed(2) },
          avgOrderValue: +(newLifetimeValue / newOrderCount).toFixed(2),
          orderFrequency: newOrderCount,
        },
      })

      // Reserve stock (decrement current, increment reserved)
      for (const it of itemsData) {
        await tx.inventory.update({
          where: { productId_warehouseId: { productId: it.productId, warehouseId } },
          data: { currentStock: { decrement: it.quantity } },
        })
        await tx.stockMovement.create({
          data: {
            productId: it.productId, warehouseId, type: 'stock_out', quantity: it.quantity,
            refType: 'sales', refId: order.id, note: `SO ${order.orderNo}`,
            createdBy: data.createdBy || null,
          },
        })
      }

      // Add timeline entry
      await tx.timelineEntry.create({
        data: {
          customerId: data.customerId,
          type: 'order',
          title: `Order placed: ${orderNo}`,
          body: `${data.items.length} items · Total ₹${total.toFixed(2)}`,
          createdBy: data.createdBy || null,
        },
      })

      // Notification
      await tx.notification.create({
        data: {
          type: 'new_order', title: `New order ${orderNo}`,
          body: `${customer.businessName} · ₹${total.toFixed(2)} · ${data.items.length} items`,
          severity: 'info', refType: 'sales_order', refId: order.id,
        },
      })

      return { order, invoice }
    })

    await db.auditLog.create({ data: { action: 'create', entity: 'sales_order', entityId: result.order.id, newValue: JSON.stringify({ orderNo: result.order.orderNo, total }) } })
    return NextResponse.json(result.order, { status: 201 })
  } catch (e: any) {
    console.error('[POST sales/orders]', e)
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
