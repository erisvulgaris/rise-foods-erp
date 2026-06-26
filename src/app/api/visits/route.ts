import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function GET() {
  const visits = await db.visit.findMany({
    include: { customer: { select: { id: true, businessName: true, area: true } }, salesman: { select: { id: true, name: true } } },
    orderBy: { scheduledAt: 'desc' },
    take: 100,
  })
  return NextResponse.json(visits)
}

const createSchema = z.object({
  customerId: z.string(),
  salesmanId: z.string().optional().nullable(),
  type: z.enum(['sales', 'collection', 'service', 'new_lead']).default('sales'),
  status: z.enum(['planned', 'completed', 'missed']).default('planned'),
  notes: z.string().optional().nullable(),
  orderValue: z.number().optional().nullable(),
  collected: z.number().optional().nullable(),
  scheduledAt: z.string(),
  completedAt: z.string().optional().nullable(),
  geoLat: z.number().optional().nullable(),
  geoLng: z.number().optional().nullable(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = createSchema.parse(body)
    const visit = await db.visit.create({
      data: {
        ...data,
        salesmanId: data.salesmanId || null,
        notes: data.notes || null,
        orderValue: data.orderValue || null,
        collected: data.collected || null,
        scheduledAt: new Date(data.scheduledAt),
        completedAt: data.completedAt ? new Date(data.completedAt) : null,
        geoLat: data.geoLat || null,
        geoLng: data.geoLng || null,
      },
    })
    // Also log as a timeline entry
    await db.timelineEntry.create({
      data: {
        customerId: data.customerId, type: 'visit',
        title: `Visit ${data.status}`,
        body: data.notes || `${data.type} visit`,
        createdBy: data.salesmanId || null,
      },
    })
    return NextResponse.json(visit, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
