import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function GET() {
  const payments = await db.payment.findMany({
    include: { customer: { select: { id: true, businessName: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(payments)
}

const createSchema = z.object({
  customerId: z.string(),
  orderId: z.string().optional().nullable(),
  invoiceId: z.string().optional().nullable(),
  amount: z.number().min(0.01),
  method: z.enum(['cash', 'upi', 'bank', 'cheque', 'credit']),
  reference: z.string().optional().nullable(),
  collectedBy: z.string().optional().nullable(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = createSchema.parse(body)
    const customer = await db.customer.findUnique({ where: { id: data.customerId } })
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 400 })
    const payCount = await db.payment.count()
    const paymentNo = `PAY-2026-${String(payCount + 1).padStart(4, '0')}`

    const result = await db.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          paymentNo,
          orderId: data.orderId || null,
          invoiceId: data.invoiceId || null,
          customerId: data.customerId,
          amount: data.amount,
          method: data.method,
          reference: data.reference || null,
          status: 'completed',
          collectedBy: data.collectedBy || null,
        },
        include: { customer: { select: { id: true, businessName: true } } },
      })
      // Update customer outstanding + lastPaymentAt
      await tx.customer.update({
        where: { id: data.customerId },
        data: { outstanding: { decrement: Math.min(customer.outstanding, data.amount) }, lastPaymentAt: new Date() },
      })
      // Update invoice balance if linked
      if (data.invoiceId) {
        const inv = await tx.invoice.findUnique({ where: { id: data.invoiceId } })
        if (inv) {
          const newPaid = inv.paid + data.amount
          await tx.invoice.update({
            where: { id: data.invoiceId },
            data: { paid: newPaid, balance: Math.max(0, inv.total - newPaid), status: newPaid >= inv.total ? 'paid' : 'partial' },
          })
        }
      }
      // Update order payment status if linked
      if (data.orderId) {
        const so = await tx.salesOrder.findUnique({ where: { id: data.orderId } })
        if (so) {
          const newPaid = so.paid + data.amount
          await tx.salesOrder.update({
            where: { id: data.orderId },
            data: { paid: newPaid, paymentStatus: newPaid >= so.total ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid' },
          })
        }
      }
      // Cash entry
      await tx.cashEntry.create({
        data: {
          type: 'receipt', amount: data.amount, category: 'sales_collection',
          description: `Payment from ${customer.businessName} (${paymentNo})`,
          refType: 'payment', refId: payment.id, createdBy: data.collectedBy || null,
        },
      })
      // Timeline
      await tx.timelineEntry.create({
        data: {
          customerId: data.customerId, type: 'payment',
          title: `Payment received: ${fmtINR(data.amount)}`,
          body: `${data.method.toUpperCase()}${data.reference ? ` · ${data.reference}` : ''} · ${paymentNo}`,
          createdBy: data.collectedBy || null,
        },
      })
      return payment
    })
    await db.auditLog.create({ data: { action: 'create', entity: 'payment', entityId: result.id, newValue: JSON.stringify({ amount: data.amount, customer: customer.businessName }) } })
    return NextResponse.json(result, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

function fmtINR(n: number) { return `₹${n.toFixed(2)}` }
