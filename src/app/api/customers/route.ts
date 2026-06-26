import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get('q') ?? ''
  const type = url.searchParams.get('type')
  const status = url.searchParams.get('status')

  const customers = await db.customer.findMany({
    where: {
      AND: [
        q ? { OR: [
          { businessName: { contains: q } },
          { ownerName: { contains: q } },
          { phone: { contains: q } },
          { area: { contains: q } },
          { district: { contains: q } },
        ] } : {},
        type ? { type } : {},
        status ? { status } : {},
      ],
    },
    include: { salesman: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(customers)
}

const createSchema = z.object({
  businessName: z.string().min(1),
  ownerName: z.string().optional(),
  phone: z.string().min(1),
  alternatePhone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  gst: z.string().optional().nullable(),
  fssai: z.string().optional().nullable(),
  address: z.string().min(1),
  district: z.string().min(1),
  area: z.string().min(1),
  pin: z.string().optional().nullable(),
  geoLat: z.number().optional().nullable(),
  geoLng: z.number().optional().nullable(),
  type: z.enum(['retailer', 'distributor', 'horeca', 'lead']).default('retailer'),
  salesmanId: z.string().optional().nullable(),
  creditLimit: z.number().min(0).default(0),
  creditDays: z.number().min(0).default(0),
  status: z.enum(['lead', 'active', 'inactive', 'blocked']).default('lead'),
  notes: z.string().optional().nullable(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = createSchema.parse(body)
    const customer = await db.customer.create({
      data: {
        ...data,
        email: data.email || null,
        gst: data.gst || null,
        fssai: data.fssai || null,
        pin: data.pin || null,
        salesmanId: data.salesmanId || null,
        notes: data.notes || null,
      },
      include: { salesman: { select: { id: true, name: true } } },
    })
    await db.auditLog.create({ data: { action: 'create', entity: 'customer', entityId: customer.id, newValue: JSON.stringify({ businessName: customer.businessName }) } })
    return NextResponse.json(customer)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
