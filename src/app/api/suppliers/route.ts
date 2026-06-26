import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function GET() {
  const suppliers = await db.supplier.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(suppliers)
}

const createSchema = z.object({
  name: z.string().min(1),
  contactPerson: z.string().optional().nullable(),
  phone: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  gst: z.string().optional().nullable(),
  address: z.string().min(1),
  district: z.string().min(1),
  rating: z.number().min(0).max(5).default(3.5),
  leadTimeDays: z.number().min(0).default(7),
  paymentTerms: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = createSchema.parse(body)
    const supplier = await db.supplier.create({
      data: {
        ...data,
        email: data.email || null, gst: data.gst || null,
        paymentTerms: data.paymentTerms || null, notes: data.notes || null,
        contactPerson: data.contactPerson || null,
      },
    })
    await db.auditLog.create({ data: { action: 'create', entity: 'supplier', entityId: supplier.id, newValue: JSON.stringify({ name: supplier.name }) } })
    return NextResponse.json(supplier, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
