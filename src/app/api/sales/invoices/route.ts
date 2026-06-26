import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const invoices = await db.invoice.findMany({
    include: { customer: { select: { id: true, businessName: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(invoices)
}
