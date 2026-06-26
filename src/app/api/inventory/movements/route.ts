import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const movements = await db.stockMovement.findMany({
    take: 200,
    orderBy: { createdAt: 'desc' },
    include: { product: { select: { id: true, name: true, sku: true } }, user: { select: { id: true, name: true } } },
  })
  return NextResponse.json(movements)
}
