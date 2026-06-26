import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function GET() {
  const tasks = await db.task.findMany({
    include: { assignee: { select: { id: true, name: true } }, customer: { select: { id: true, businessName: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return NextResponse.json(tasks)
}

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  type: z.enum(['followup', 'collection', 'delivery', 'order', 'other']).default('followup'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  dueDate: z.string().optional().nullable(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = createSchema.parse(body)
    const task = await db.task.create({
      data: {
        ...data,
        assigneeId: data.assigneeId || null,
        customerId: data.customerId || null,
        description: data.description || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
      include: { assignee: { select: { id: true, name: true } }, customer: { select: { id: true, businessName: true } } },
    })
    return NextResponse.json(task, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
