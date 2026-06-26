import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function GET() {
  const orders = await db.purchaseOrder.findMany({
    include: {
      supplier: { select: { id: true, name: true, phone: true } },
      warehouse: { select: { id: true, name: true, code: true } },
      items: { include: { product: { select: { id: true, name: true, sku: true, packagingSize: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(orders)
}

const itemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1),
  unitCost: z.number().min(0),
  taxPercent: z.number().min(0).default(5),
})

const createSchema = z.object({
  supplierId: z.string(),
  warehouseId: z.string(),
  items: z.array(itemSchema).min(1),
  expectedAt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  createdBy: z.string().optional().nullable(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    let subtotal = 0
    const itemsData = data.items.map((it) => {
      const total = +(it.quantity * it.unitCost).toFixed(2)
      subtotal += total
      return { ...it, total }
    })
    const tax = +(subtotal * 0.05).toFixed(2)
    const total = +(subtotal + tax).toFixed(2)

    const poCount = await db.purchaseOrder.count()
    const poNo = `PO-2026-${String(poCount + 1).padStart(4, '0')}`

    const po = await db.purchaseOrder.create({
      data: {
        poNo, supplierId: data.supplierId, warehouseId: data.warehouseId,
        status: 'sent', subtotal: +subtotal.toFixed(2), tax, total, paid: 0,
        expectedAt: data.expectedAt ? new Date(data.expectedAt) : new Date(Date.now() + 7 * 86400000),
        notes: data.notes || null, createdBy: data.createdBy || null,
        items: { create: itemsData.map((it) => ({ ...it, receivedQty: 0 })) },
      },
      include: {
        supplier: { select: { id: true, name: true, phone: true } },
        warehouse: { select: { id: true, name: true, code: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true, packagingSize: true } } } },
      },
    })
    // Increase incoming stock on inventory
    for (const it of itemsData) {
      const inv = await db.inventory.findUnique({ where: { productId_warehouseId: { productId: it.productId, warehouseId: data.warehouseId } } })
      if (inv) {
        await db.inventory.update({ where: { id: inv.id }, data: { incomingStock: { increment: it.quantity } } })
      } else {
        await db.inventory.create({ data: { productId: it.productId, warehouseId: data.warehouseId, currentStock: 0, incomingStock: it.quantity, reorderLevel: 10 } })
      }
    }
    await db.auditLog.create({ data: { action: 'create', entity: 'purchase_order', entityId: po.id, newValue: JSON.stringify({ poNo, total }) } })
    return NextResponse.json(po, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
