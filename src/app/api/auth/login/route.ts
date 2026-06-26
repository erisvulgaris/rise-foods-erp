import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createHash } from 'crypto'

const hash = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 40)

export const dynamic = 'force-dynamic'

// Demo auth: validate against seeded users.
// In production this would be Appwrite Auth.
export async function POST(req: Request) {
  const { email, password } = await req.json()
  const user = await db.user.findUnique({ where: { email } })
  if (!user || user.passwordHash !== hash(password)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }
  if (!user.isActive) {
    return NextResponse.json({ error: 'Account disabled' }, { status: 403 })
  }
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
  await db.auditLog.create({ data: { userId: user.id, action: 'login', entity: 'auth', entityId: user.id, ip: req.headers.get('x-forwarded-for') ?? '127.0.0.1', device: req.headers.get('user-agent') ?? 'unknown' } })
  return NextResponse.json({
    id: user.id, email: user.email, name: user.name, role: user.role,
    employeeId: user.employeeId, phone: user.phone, avatar: user.avatar,
  })
}
