import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const logs = await db.auditLog.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, name: true, role: true } } },
  })
  return NextResponse.json(logs)
}
