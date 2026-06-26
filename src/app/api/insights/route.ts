import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const insights = await db.aIInsight.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(insights)
}
