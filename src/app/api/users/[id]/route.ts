import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const user = await db.user.update({ where: { id }, data: body })
    await db.auditLog.create({ data: { action: 'update', entity: 'user', entityId: id, newValue: JSON.stringify({ name: user.name, role: user.role }) } })
    return NextResponse.json({ ...user, passwordHash: undefined })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.user.update({ where: { id }, data: { isActive: false } })
    await db.auditLog.create({ data: { action: 'delete', entity: 'user', entityId: id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
