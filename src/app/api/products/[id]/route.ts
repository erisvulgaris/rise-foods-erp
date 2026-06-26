import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await db.product.findUnique({
    where: { id },
    include: { category: { select: { id: true, name: true } } },
  })
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(product)
}

const updateSchema = z.object({
  sku: z.string().min(1).optional(),
  barcode: z.string().optional().nullable(),
  name: z.string().min(1).optional(),
  categoryId: z.string().optional().nullable(),
  brand: z.string().optional(),
  description: z.string().optional().nullable(),
  hsn: z.string().optional().nullable(),
  gstRate: z.number().min(0).optional(),
  mrp: z.number().min(0).optional(),
  wholesalePrice: z.number().min(0).optional(),
  distributorPrice: z.number().min(0).optional(),
  retailPrice: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  packagingSize: z.string().optional().nullable(),
  shelfLifeDays: z.number().min(1).optional(),
  moq: z.number().min(1).optional(),
  reorderLevel: z.number().min(0).optional(),
  abcClass: z.enum(['A', 'B', 'C']).optional(),
  xyzClass: z.enum(['X', 'Y', 'Z']).optional(),
  status: z.enum(['active', 'discontinued', 'draft']).optional(),
})

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const data = updateSchema.parse(body)
    // recompute margin
    if (data.retailPrice !== undefined || data.costPrice !== undefined) {
      const current = await db.product.findUnique({ where: { id } })
      const rp = data.retailPrice ?? current!.retailPrice
      const cp = data.costPrice ?? current!.costPrice
      data.marginPercent = +(((rp - cp) / rp) * 100).toFixed(2) as any
    }
    const product = await db.product.update({
      where: { id },
      data: { ...data, categoryId: data.categoryId !== undefined ? (data.categoryId || null) : undefined },
      include: { category: { select: { id: true, name: true } } },
    })
    await db.auditLog.create({ data: { action: 'update', entity: 'product', entityId: id, newValue: JSON.stringify({ sku: product.sku }) } })
    return NextResponse.json(product)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.product.update({ where: { id }, data: { status: 'discontinued' } })
    await db.auditLog.create({ data: { action: 'delete', entity: 'product', entityId: id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
