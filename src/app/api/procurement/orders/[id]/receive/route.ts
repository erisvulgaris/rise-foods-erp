import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GRN — Receive a purchase order into stock
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const po = await db.purchaseOrder.findUnique({
      where: { id },
      include: { items: true, supplier: true, warehouse: true },
    })
    if (!po) return NextResponse.json({ error: 'PO not found' }, { status: 404 })
    if (po.status === 'received') return NextResponse.json({ error: 'PO already received' }, { status: 400 })

    const result = await db.$transaction(async (tx) => {
      // Update each PO item as received
      for (const item of po.items) {
        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: { receivedQty: item.quantity },
        })
        // Increment inventory stock
        const inv = await tx.inventory.findUnique({
          where: { productId_warehouseId: { productId: item.productId, warehouseId: po.warehouseId } },
        })
        if (inv) {
          await tx.inventory.update({
            where: { id: inv.id },
            data: {
              currentStock: { increment: item.quantity },
              incomingStock: { decrement: Math.min(inv.incomingStock, item.quantity) },
              lastStockAt: new Date(),
              valuation: { increment: item.quantity * item.unitCost },
            },
          })
        } else {
          await tx.inventory.create({
            data: {
              productId: item.productId,
              warehouseId: po.warehouseId,
              currentStock: item.quantity,
              valuation: item.quantity * item.unitCost,
              reorderLevel: 10,
            },
          })
        }
        // Create stock movement
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            warehouseId: po.warehouseId,
            type: 'stock_in',
            quantity: item.quantity,
            refType: 'purchase',
            refId: po.id,
            note: `GRN: ${po.poNo}`,
          },
        })
        // Create a batch for the received items
        const product = await tx.product.findUnique({ where: { id: item.productId } })
        if (product) {
          const batchNo = `B-${product.sku.replace(/-/g, '')}-${Date.now().toString().slice(-6)}`
          await tx.batch.create({
            data: {
              batchNo,
              productId: item.productId,
              warehouseId: po.warehouseId,
              quantity: item.quantity,
              costPrice: item.unitCost,
              mfgDate: new Date(),
              expiryDate: new Date(Date.now() + product.shelfLifeDays * 86400000),
              receivedAt: new Date(),
              status: 'in_stock',
              supplierId: po.supplierId,
            },
          })
        }
      }
      // Update PO status
      const updated = await tx.purchaseOrder.update({
        where: { id },
        data: { status: 'received', receivedAt: new Date() },
      })
      // Audit log
      await tx.auditLog.create({
        data: { action: 'receive', entity: 'purchase_order', entityId: id, newValue: JSON.stringify({ poNo: po.poNo }) },
      })
      // Notification
      await tx.notification.create({
        data: {
          type: 'system',
          title: `PO Received: ${po.poNo}`,
          body: `${po.items.length} items received from ${po.supplier.name} into ${po.warehouse.name}`,
          severity: 'success',
          refType: 'purchase_order',
          refId: id,
        },
      })
      return updated
    })
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
