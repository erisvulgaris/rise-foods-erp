import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const customer = await db.customer.findUnique({
    where: { id },
    include: { salesman: { select: { id: true, name: true } } },
  })
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(customer)
}

const updateSchema = z.object({
  businessName: z.string().min(1).optional(),
  ownerName: z.string().optional().nullable(),
  phone: z.string().min(1).optional(),
  alternatePhone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  gst: z.string().optional().nullable(),
  fssai: z.string().optional().nullable(),
  address: z.string().min(1).optional(),
  district: z.string().min(1).optional(),
  area: z.string().min(1).optional(),
  pin: z.string().optional().nullable(),
  geoLat: z.number().optional().nullable(),
  geoLng: z.number().optional().nullable(),
  type: z.enum(['retailer', 'distributor', 'horeca', 'lead']).optional(),
  salesmanId: z.string().optional().nullable(),
  creditLimit: z.number().min(0).optional(),
  creditDays: z.number().min(0).optional(),
  status: z.enum(['lead', 'active', 'inactive', 'blocked']).optional(),
  notes: z.string().optional().nullable(),
})

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const data = updateSchema.parse(body)
    const before = await db.customer.findUnique({ where: { id } })
    if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const customer = await db.customer.update({
      where: { id },
      data: {
        ...data,
        email: data.email !== undefined ? (data.email || null) : undefined,
        gst: data.gst !== undefined ? (data.gst || null) : undefined,
        fssai: data.fssai !== undefined ? (data.fssai || null) : undefined,
        pin: data.pin !== undefined ? (data.pin || null) : undefined,
        salesmanId: data.salesmanId !== undefined ? (data.salesmanId || null) : undefined,
        notes: data.notes !== undefined ? (data.notes || null) : undefined,
      },
      include: { salesman: { select: { id: true, name: true } } },
    })
    await db.auditLog.create({ data: { action: 'update', entity: 'customer', entityId: id, oldValue: JSON.stringify({ businessName: before.businessName }), newValue: JSON.stringify({ businessName: customer.businessName }) } })
    return NextResponse.json(customer)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.customer.delete({ where: { id } })
    await db.auditLog.create({ data: { action: 'delete', entity: 'customer', entityId: id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
