import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.notification.update({ where: { id }, data: { isRead: true } })
  return NextResponse.json({ ok: true })
}
