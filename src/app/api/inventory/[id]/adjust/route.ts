import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const adjustSchema = z.object({
  productId: z.string(),
  warehouseId: z.string(),
  type: z.enum(['adjustment', 'damaged', 'lost', 'expired', 'transfer_in', 'transfer_out']),
  quantity: z.number().int(),  // positive for additions, negative for removals
  note: z.string().optional(),
  createdBy: z.string().optional().nullable(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = adjustSchema.parse(body)
    const inv = await db.inventory.findUnique({ where: { productId_warehouseId: { productId: data.productId, warehouseId: data.warehouseId } } })
    if (!inv) return NextResponse.json({ error: 'Inventory record not found' }, { status: 404 })

    const absQty = Math.abs(data.quantity)
    const isAddition = data.quantity > 0
    const movementType = isAddition ? 'stock_in' : 'stock_out'
    const finalType = data.type === 'damaged' ? 'damaged' : data.type === 'lost' ? 'lost' : data.type === 'expired' ? 'expired' : movementType

    if (!isAddition && inv.currentStock < absQty) {
      return NextResponse.json({ error: 'Insufficient stock for adjustment' }, { status: 400 })
    }

    await db.$transaction(async (tx) => {
      await tx.inventory.update({
        where: { id: inv.id },
        data: { currentStock: { increment: data.quantity }, lastStockAt: new Date() },
      })
      await tx.stockMovement.create({
        data: {
          productId: data.productId, warehouseId: data.warehouseId,
          type: finalType, quantity: absQty, refType: 'adjustment',
          note: data.note || `${data.type} adjustment`,
          createdBy: data.createdBy || null,
        },
      })
    })
    await db.auditLog.create({ data: { action: 'update', entity: 'inventory', entityId: inv.id, newValue: JSON.stringify({ type: data.type, qty: data.quantity }) } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
