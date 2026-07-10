import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET — return all settings as key-value pairs
export async function GET() {
  const settings = await db.setting.findMany()
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]))
  return NextResponse.json(map)
}

// PUT — update multiple settings at once
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const updates = body as Record<string, string>
    for (const [key, value] of Object.entries(updates)) {
      const existing = await db.setting.findUnique({ where: { key } })
      if (existing) {
        await db.setting.update({ where: { key }, data: { value } })
      } else {
        await db.setting.create({ data: { key, value, category: 'general' } })
      }
    }
    await db.auditLog.create({ data: { action: 'update', entity: 'settings', entityId: 'company', newValue: JSON.stringify(updates) } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
