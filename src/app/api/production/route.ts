import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function GET() {
  const batches = await db.productionBatch.findMany({
    include: {
      operator: { select: { id: true, name: true } },
      items: { include: { product: { select: { id: true, name: true, sku: true } } } },
    },
    orderBy: { startDate: 'desc' },
  })
  const withProduct = batches.map((b) => ({
    ...b,
    product: b.items.find((i) => i.type === 'finished_good')?.product ?? null,
  }))
  return NextResponse.json(withProduct)
}

const createSchema = z.object({
  productId: z.string(),
  batchNo: z.string().min(1),
  startDate: z.string(),
  inputQty: z.number().min(0),
  outputQty: z.number().min(0),
  machineName: z.string().optional().nullable(),
  operatorId: z.string().optional().nullable(),
  stage: z.enum(['cleaning', 'grinding', 'packing', 'finished', 'qc']).default('cleaning'),
  cost: z.number().min(0).default(0),
  downtime: z.number().min(0).default(0),
  notes: z.string().optional().nullable(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = createSchema.parse(body)
    const yieldPercent = data.inputQty > 0 ? +((data.outputQty / data.inputQty) * 100).toFixed(2) : 0
    const lossPercent = +(100 - yieldPercent).toFixed(2)
    const batch = await db.productionBatch.create({
      data: {
        batchNo: data.batchNo,
        productId: data.productId,
        startDate: new Date(data.startDate),
        stage: data.stage,
        inputQty: data.inputQty, outputQty: data.outputQty,
        yieldPercent, lossPercent,
        machineName: data.machineName || null,
        operatorId: data.operatorId || null,
        cost: data.cost, downtime: data.downtime,
        notes: data.notes || null,
        items: { create: [{ productId: data.productId, type: 'finished_good', quantity: data.outputQty, unit: 'packs' }] },
      },
      include: {
        operator: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
    })
    return NextResponse.json({ ...batch, product: batch.items[0]?.product ?? null }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
