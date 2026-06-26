import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const batches = await db.batch.findMany({
    include: {
      product: { select: { id: true, name: true, sku: true, packagingSize: true, category: { select: { name: true } } } },
      warehouse: { select: { id: true, name: true } },
      supplier: { select: { id: true, name: true } },
    },
    orderBy: { expiryDate: 'asc' },
  })
  return NextResponse.json(batches)
}
