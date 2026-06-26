import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const inventory = await db.inventory.findMany({
    include: {
      product: { select: { id: true, name: true, sku: true, costPrice: true, abcClass: true, xyzClass: true, packagingSize: true, category: { select: { name: true } }, reorderLevel: true } },
      warehouse: { select: { id: true, name: true, code: true } },
    },
    orderBy: { product: { name: 'asc' } },
  })
  return NextResponse.json(inventory)
}
