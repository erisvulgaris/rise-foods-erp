import { NextResponse } from 'next/server'
import { getDashboard } from '@/shared/services/queries'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await getDashboard()
    return NextResponse.json(data)
  } catch (e) {
    console.error('[dashboard]', e)
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}
