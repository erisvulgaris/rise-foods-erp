import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const routes = await db.route.findMany({
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(routes)
}
