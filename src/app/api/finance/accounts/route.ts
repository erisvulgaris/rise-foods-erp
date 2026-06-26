import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const accounts = await db.bankAccount.findMany({ orderBy: { balance: 'desc' } })
  return NextResponse.json(accounts)
}
