import { NextResponse } from 'next/server'
import { getPNL } from '@/shared/services/queries'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(await getPNL())
}
