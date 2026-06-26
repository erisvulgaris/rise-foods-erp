import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { createHash } from 'crypto'

const hash = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 40)

export const dynamic = 'force-dynamic'

export async function GET() {
  const users = await db.user.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(users.map((u) => ({ ...u, passwordHash: undefined })))
}

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6).optional(),
  phone: z.string().optional(),
  role: z.string().default('staff'),
  employeeId: z.string().optional(),
  isActive: z.boolean().default(true),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = createSchema.parse(body)
    const existing = await db.user.findUnique({ where: { email: data.email } })
    if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    const user = await db.user.create({
      data: {
        email: data.email, name: data.name, passwordHash: hash(data.password ?? 'changeme123'),
        phone: data.phone, role: data.role, employeeId: data.employeeId, isActive: data.isActive,
      },
    })
    await db.auditLog.create({ data: { action: 'create', entity: 'user', entityId: user.id, newValue: JSON.stringify({ email: user.email, role: user.role }) } })
    return NextResponse.json({ ...user, passwordHash: undefined })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
