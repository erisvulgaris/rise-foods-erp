import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function GET() {
  const accounts = await db.bankAccount.findMany({ orderBy: { balance: 'desc' } })
  return NextResponse.json(accounts)
}

const createSchema = z.object({
  name: z.string().min(1),
  bank: z.string().min(1),
  accountNo: z.string().min(1),
  ifsc: z.string().optional().nullable(),
  branch: z.string().optional().nullable(),
  balance: z.number().default(0),
  type: z.enum(['current', 'savings', 'cash', 'upi']).default('current'),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = createSchema.parse(body)
    const account = await db.bankAccount.create({ data: { ...data, ifsc: data.ifsc || null, branch: data.branch || null } })
    return NextResponse.json(account, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
