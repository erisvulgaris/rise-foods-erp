import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const order = await db.salesOrder.findUnique({ where: { id } })
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (order.status !== 'cancelled' && order.status !== 'pending') {
      return NextResponse.json({ error: 'Cannot delete order — cancel it first' }, { status: 400 })
    }
    await db.salesOrder.delete({ where: { id } })
    await db.auditLog.create({ data: { action: 'delete', entity: 'sales_order', entityId: id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
