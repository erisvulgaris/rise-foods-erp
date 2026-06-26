import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function GET() {
  const expenses = await db.expense.findMany({ orderBy: { date: 'desc' } })
  return NextResponse.json(expenses)
}

const createSchema = z.object({
  category: z.string(),
  subcategory: z.string().optional().nullable(),
  amount: z.number().min(0.01),
  date: z.string(),
  vendor: z.string().optional().nullable(),
  paymentMode: z.enum(['cash', 'upi', 'bank', 'cheque']).default('cash'),
  status: z.enum(['paid', 'pending']).default('paid'),
  note: z.string().optional().nullable(),
  createdBy: z.string().optional().nullable(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = createSchema.parse(body)
    const expense = await db.expense.create({
      data: {
        ...data,
        subcategory: data.subcategory || null,
        vendor: data.vendor || null,
        note: data.note || null,
        createdBy: data.createdBy || null,
        date: new Date(data.date),
      },
    })
    // Cash entry if paid
    if (data.status === 'paid') {
      await db.cashEntry.create({
        data: {
          type: 'payment', amount: data.amount, category: data.category,
          description: `Expense: ${data.vendor ?? data.category}`,
          refType: 'expense', refId: expense.id, createdBy: data.createdBy || null,
          date: new Date(data.date),
        },
      })
    }
    await db.auditLog.create({ data: { action: 'create', entity: 'expense', entityId: expense.id, newValue: JSON.stringify({ amount: data.amount, category: data.category }) } })
    return NextResponse.json(expense, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
