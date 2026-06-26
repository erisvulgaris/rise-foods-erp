import { NextResponse } from 'next/server'
import { getAnalytics } from '@/shared/services/queries'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(await getAnalytics())
  } catch (e) {
    console.error('[analytics]', e)
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 })
  }
}
