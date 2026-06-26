import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  customerId: z.string(),
  type: z.enum(['note', 'call', 'visit', 'whatsapp', 'invoice', 'payment', 'order', 'email']),
  title: z.string().min(1),
  body: z.string().optional().nullable(),
  createdBy: z.string().optional().nullable(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = createSchema.parse(body)
    const entry = await db.timelineEntry.create({
      data: {
        customerId: data.customerId, type: data.type, title: data.title,
        body: data.body || null, createdBy: data.createdBy || null,
      },
    })
    return NextResponse.json(entry, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
