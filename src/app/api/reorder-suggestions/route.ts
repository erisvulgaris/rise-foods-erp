import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * Calculates reorder suggestions based on:
 * - Current stock + incoming stock
 * - Sales velocity (last 30 days)
 * - Days of cover
 * - ABC class weighting
 * - Lead time buffer
 */
export async function GET() {
  const [inventory, soItems30] = await Promise.all([
    db.inventory.findMany({
      include: {
        product: { select: { id: true, name: true, sku: true, packagingSize: true, abcClass: true, costPrice: true, reorderLevel: true, moq: true } },
        warehouse: { select: { id: true, name: true, code: true } },
      },
    }),
    db.salesOrderItem.findMany({
      where: { so: { status: { not: 'cancelled' }, createdAt: { gte: new Date(Date.now() - 30 * 86400000) } } },
    }),
  ])

  const salesByProduct = new Map<string, number>()
  for (const it of soItems30) {
    salesByProduct.set(it.productId, (salesByProduct.get(it.productId) ?? 0) + it.quantity)
  }

  const suggestions = inventory.map((inv) => {
    const sold30 = salesByProduct.get(inv.productId) ?? 0
    const dailyVelocity = sold30 / 30
    const totalStock = inv.currentStock + inv.incomingStock
    const daysOfCover = dailyVelocity > 0 ? totalStock / dailyVelocity : 999
    const leadTimeBuffer = 7 // 7-day procurement buffer
    const targetDays = inv.product.abcClass === 'A' ? 30 : inv.product.abcClass === 'B' ? 21 : 14
    const reorderQty = Math.max(inv.product.moq, Math.ceil(dailyVelocity * (targetDays + leadTimeBuffer) - totalStock))
    const needsReorder = inv.currentStock <= inv.reorderLevel || daysOfCover < 14
    const urgency = daysOfCover < 7 ? 'critical' : daysOfCover < 14 ? 'high' : daysOfCover < 21 ? 'medium' : 'low'
    const estimatedCost = reorderQty * inv.product.costPrice
    return {
      productId: inv.productId,
      productName: inv.product.name,
      sku: inv.product.sku,
      packagingSize: inv.product.packagingSize,
      warehouse: inv.warehouse.code,
      currentStock: inv.currentStock,
      incomingStock: inv.incomingStock,
      reorderLevel: inv.reorderLevel,
      dailyVelocity: +dailyVelocity.toFixed(2),
      daysOfCover: +daysOfCover.toFixed(0),
      abcClass: inv.product.abcClass,
      reorderQty: Math.max(0, reorderQty),
      estimatedCost: +estimatedCost.toFixed(2),
      needsReorder,
      urgency,
    }
  }).filter((s) => s.needsReorder).sort((a, b) => a.daysOfCover - b.daysOfCover)

  return NextResponse.json({
    suggestions,
    totalReorderCost: +suggestions.reduce((s, x) => s + x.estimatedCost, 0).toFixed(2),
    criticalCount: suggestions.filter((s) => s.urgency === 'critical').length,
  })
}
