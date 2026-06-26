import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function GET() {
  const products = await db.product.findMany({
    include: { category: { select: { id: true, name: true } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(products)
}

const createSchema = z.object({
  sku: z.string().min(1),
  barcode: z.string().optional().nullable(),
  name: z.string().min(1),
  categoryId: z.string().optional().nullable(),
  brand: z.string().default('Rise Foods'),
  description: z.string().optional().nullable(),
  hsn: z.string().optional().nullable(),
  gstRate: z.number().min(0).default(5),
  mrp: z.number().min(0),
  wholesalePrice: z.number().min(0),
  distributorPrice: z.number().min(0),
  retailPrice: z.number().min(0),
  costPrice: z.number().min(0),
  packagingSize: z.string().optional().nullable(),
  shelfLifeDays: z.number().min(1).default(540),
  moq: z.number().min(1).default(1),
  reorderLevel: z.number().min(0).default(10),
  abcClass: z.enum(['A', 'B', 'C']).default('C'),
  xyzClass: z.enum(['X', 'Y', 'Z']).default('Z'),
  status: z.enum(['active', 'discontinued', 'draft']).default('active'),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = createSchema.parse(body)
    const marginPercent = +(((data.retailPrice - data.costPrice) / data.retailPrice) * 100).toFixed(2)
    const product = await db.product.create({
      data: { ...data, categoryId: data.categoryId || null, marginPercent },
      include: { category: { select: { id: true, name: true } } },
    })
    await db.auditLog.create({ data: { action: 'create', entity: 'product', entityId: product.id, newValue: JSON.stringify({ sku: product.sku, name: product.name }) } })
    return NextResponse.json(product)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
