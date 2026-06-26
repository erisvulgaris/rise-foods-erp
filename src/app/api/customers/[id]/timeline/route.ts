import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const timeline = await db.timelineEntry.findMany({
    where: { customerId: id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json(timeline)
}

const createSchema = z.object({
  type: z.enum(['note', 'call', 'visit', 'whatsapp', 'invoice', 'payment', 'order', 'email']),
  title: z.string().min(1),
  body: z.string().optional().nullable(),
  createdBy: z.string().optional().nullable(),
})

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const data = createSchema.parse(body)
    const entry = await db.timelineEntry.create({
      data: {
        customerId: id, type: data.type, title: data.title,
        body: data.body || null, createdBy: data.createdBy || null,
      },
    })
    await db.auditLog.create({ data: { action: 'create', entity: 'timeline', entityId: entry.id, newValue: JSON.stringify({ type: data.type, title: data.title }) } })
    return NextResponse.json(entry, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
