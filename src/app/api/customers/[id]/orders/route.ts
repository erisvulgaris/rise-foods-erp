import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const orders = await db.salesOrder.findMany({
    where: { customerId: id },
    include: {
      customer: { select: { id: true, businessName: true, phone: true, area: true, district: true } },
      salesman: { select: { id: true, name: true } },
      items: { include: { product: { select: { id: true, name: true, sku: true, packagingSize: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(orders)
}
