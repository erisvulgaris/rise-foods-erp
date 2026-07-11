import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const vehicles = await db.vehicle.findMany({ orderBy: { number: 'asc' } })
  return NextResponse.json(vehicles)
}
