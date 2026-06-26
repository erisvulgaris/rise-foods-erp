'use client'
import { useState } from 'react'
import { PageHeader } from '@/shared/components/page-header'
import { DataTable, type Column } from '@/shared/components/data-table'
import { KPICard } from '@/shared/components/kpi-card'
import { Badge, StatusBadge } from '@/shared/components/status-badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ShoppingCart, TrendingUp, Wallet, Truck, Plus, Download, Receipt, IndianRupee, ArrowRight, X, FileText } from 'lucide-react'
import { fmtINR, fmtNumber, fmtDate, fmtDateTime, exportCSV, cn } from '@/shared/lib/format'
import { AreaChartCard } from '@/shared/components/charts'
import { NewOrderDrawer } from './new-order-drawer'
import { useSalesOrders, useInvoices, usePayments, useAdvanceOrder } from '@/shared/services/mutations'
import type { SalesOrder, Invoice, Payment } from '@/shared/types'

export function SalesModule() {
  const { data: orders = [], isLoading: loadingOrders } = useSalesOrders()
  const { data: invoices = [], isLoading: loadingInvoices } = useInvoices()
  const { data: payments = [], isLoading: loadingPayments } = usePayments()
  const advanceOrder = useAdvanceOrder()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null)

  const loading = loadingOrders || loadingInvoices || loadingPayments

  const totalRevenue = orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0)
  const totalProfit = orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.profit, 0)
  const totalCollected = payments.filter((p) => p.status === 'completed').reduce((s, p) => s + p.amount, 0)
  const totalOutstanding = invoices.reduce((s, i) => s + i.balance, 0)
  const pending = orders.filter((o) => o.status === 'pending').length
  const delivered = orders.filter((o) => o.status === 'delivered').length
  const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  const orderColumns: Column<SalesOrder>[] = [
    {
      key: 'orderNo', header: 'Order #', sortable: true,
      cell: (o) => (
        <div>
          <p className="font-mono text-xs font-medium">{o.orderNo}</p>
          <p className="text-[10px] text-muted-foreground">{fmtDateTime(o.createdAt)}</p>
        </div>
      ),
    },
    {
      key: 'customer', header: 'Customer', sortable: true, sortAccessor: (o) => o.customer.businessName,
      cell: (o) => (
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{o.customer.businessName}</p>
          <p className="text-xs text-muted-foreground">{o.customer.area}</p>
        </div>
      ),
    },
    {
      key: 'itemsCount', header: 'Items', align: 'center', sortable: true,
      cell: (o) => <span className="tabular-nums">{o.itemsCount}</span>,
    },
    {
      key: 'total', header: 'Total', align: 'right', sortable: true,
      cell: (o) => <span className="tabular-nums text-sm font-medium">{fmtINR(o.total)}</span>,
    },
    {
      key: 'profit', header: 'Profit', align: 'right', sortable: true,
      cell: (o) => <span className="tabular-nums text-sm text-emerald-600 dark:text-emerald-400">{fmtINR(o.profit, true)}</span>,
    },
    {
      key: 'status', header: 'Status', align: 'center',
      cell: (o) => <StatusBadge status={o.status} />,
    },
    {
      key: 'paymentStatus', header: 'Payment', align: 'center',
      cell: (o) => <StatusBadge status={o.paymentStatus} />,
    },
    {
      key: 'salesman', header: 'Salesman',
      cell: (o) => <span className="text-xs">{o.salesman?.name ?? '—'}</span>,
    },
    {
      key: 'actions', header: 'Actions', align: 'right',
      cell: (o) => (
        <div className="flex items-center justify-end gap-1">
          {o.status !== 'delivered' && o.status !== 'cancelled' && (
            <Button
              variant="ghost" size="sm" className="h-7 px-2 text-xs"
              onClick={(e) => { e.stopPropagation(); advanceOrder.mutate({ id: o.id, action: 'advance' }) }}
              disabled={advanceOrder.isPending}
            >
              <ArrowRight className="h-3 w-3" /> {o.status === 'pending' ? 'Pack' : o.status === 'packed' ? 'Dispatch' : 'Deliver'}
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); setSelectedOrder(o) }}>
            <FileText className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ]

  const invoiceColumns: Column<Invoice>[] = [
    {
      key: 'invoiceNo', header: 'Invoice #', sortable: true,
      cell: (i) => <span className="font-mono text-xs">{i.invoiceNo}</span>,
    },
    {
      key: 'customer', header: 'Customer', sortable: true,
      cell: (i) => <span className="text-sm">{i.customer.businessName}</span>,
    },
    {
      key: 'total', header: 'Total', align: 'right', sortable: true,
      cell: (i) => <span className="tabular-nums">{fmtINR(i.total)}</span>,
    },
    {
      key: 'paid', header: 'Paid', align: 'right', sortable: true,
      cell: (i) => <span className="tabular-nums text-emerald-600 dark:text-emerald-400">{fmtINR(i.paid)}</span>,
    },
    {
      key: 'balance', header: 'Balance', align: 'right', sortable: true,
      cell: (i) => <span className={cn('tabular-nums', i.balance > 0 ? 'text-rose-600 dark:text-rose-400 font-medium' : '')}>{fmtINR(i.balance)}</span>,
    },
    {
      key: 'status', header: 'Status', align: 'center',
      cell: (i) => <StatusBadge status={i.status} />,
    },
    {
      key: 'dueDate', header: 'Due Date', sortable: true,
      cell: (i) => <span className="text-xs text-muted-foreground">{fmtDate(i.dueDate)}</span>,
    },
    {
      key: 'actions', header: '', align: 'right',
      cell: (i) => (
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={(e) => { e.stopPropagation(); window.open(`/api/invoices/${i.id}/pdf`, '_blank') }}>
          <FileText className="h-3 w-3" /> View
        </Button>
      ),
    },
  ]

  const paymentColumns: Column<Payment>[] = [
    {
      key: 'paymentNo', header: 'Payment #', sortable: true,
      cell: (p) => <span className="font-mono text-xs">{p.paymentNo}</span>,
    },
    {
      key: 'customer', header: 'Customer', sortable: true,
      cell: (p) => <span className="text-sm">{p.customer.businessName}</span>,
    },
    {
      key: 'amount', header: 'Amount', align: 'right', sortable: true,
      cell: (p) => <span className="tabular-nums font-medium text-emerald-600 dark:text-emerald-400">{fmtINR(p.amount)}</span>,
    },
    {
      key: 'method', header: 'Method', align: 'center',
      cell: (p) => <Badge variant="outline" className="capitalize">{p.method}</Badge>,
    },
    {
      key: 'reference', header: 'Reference',
      cell: (p) => <span className="text-xs font-mono">{p.reference ?? '—'}</span>,
    },
    {
      key: 'status', header: 'Status', align: 'center',
      cell: (p) => <StatusBadge status={p.status} />,
    },
    {
      key: 'createdAt', header: 'Date', sortable: true,
      cell: (p) => <span className="text-xs text-muted-foreground">{fmtDateTime(p.createdAt)}</span>,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Management"
        description="Orders, invoices, payments, dispatch"
        icon={ShoppingCart}
        accent="success"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => exportCSV('sales-orders.csv', orders as any)}>
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button size="sm" onClick={() => setDrawerOpen(true)}><Plus className="h-4 w-4" /> New Order</Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Total Revenue" value={fmtINR(totalRevenue, true)} icon={IndianRupee} accent="primary" sublabel={`${orders.length} orders`} delta={15.2} deltaLabel="MoM" />
        <KPICard label="Gross Profit" value={fmtINR(totalProfit, true)} icon={TrendingUp} accent="success" sublabel={`${margin.toFixed(1)}% margin`} delta={6.8} deltaLabel="MoM" />
        <KPICard label="Collected" value={fmtINR(totalCollected, true)} icon={Wallet} accent="info" sublabel={`${payments.length} payments`} />
        <KPICard label="Outstanding" value={fmtINR(totalOutstanding, true)} icon={Truck} accent="warning" sublabel={`${invoices.filter((i) => i.balance > 0).length} unpaid invoices`} />
      </div>

      <Card className="p-5 shadow-soft">
        <h3 className="text-sm font-semibold mb-3">Revenue Trend (last 30 days)</h3>
        <AreaChartCard
          data={orders.filter((o) => o.status !== 'cancelled').reduce((acc: any[], o) => {
            const d = new Date(o.createdAt).toISOString().slice(5, 10)
            const found = acc.find((x) => x.date === d)
            if (found) { found.revenue += o.total; found.profit += o.profit }
            else acc.push({ date: d, revenue: o.total, profit: o.profit })
            return acc
          }, []).sort((a, b) => a.date.localeCompare(b.date))}
          xKey="date"
          yKeys={[{ key: 'revenue', label: 'Revenue', color: 'var(--chart-1)' }, { key: 'profit', label: 'Profit', color: 'var(--chart-2)' }]}
          height={200}
          showLegend
          formatter={(v) => fmtINR(v, true)}
        />
      </Card>

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
          <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
          <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="orders" className="mt-4">
          <DataTable data={orders} columns={orderColumns} loading={loading} pageSize={12} searchPlaceholder="Search orders..." />
        </TabsContent>
        <TabsContent value="invoices" className="mt-4">
          <DataTable data={invoices} columns={invoiceColumns} loading={loading} pageSize={12} searchPlaceholder="Search invoices..." />
        </TabsContent>
        <TabsContent value="payments" className="mt-4">
          <DataTable data={payments} columns={paymentColumns} loading={loading} pageSize={12} searchPlaceholder="Search payments..." />
        </TabsContent>
      </Tabs>

      <NewOrderDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      <OrderDetailDrawer order={selectedOrder} onClose={() => setSelectedOrder(null)} onAdvance={(id) => advanceOrder.mutate({ id, action: 'advance' })} onCancel={(id) => advanceOrder.mutate({ id, action: 'cancel' })} />
    </div>
  )
}

function OrderDetailDrawer({ order, onClose, onAdvance, onCancel }: { order: SalesOrder | null; onClose: () => void; onAdvance: (id: string) => void; onCancel: (id: string) => void }) {
  if (!order) return null
  const invoice = order.invoices?.[0]
  const FLOW: Record<string, string | null> = { pending: 'packed', packed: 'dispatched', dispatched: 'delivered', delivered: null, cancelled: null }
  const next = FLOW[order.status]
  return (
    <Drawer open={!!order} onOpenChange={(b) => !b && onClose()}>
      <DrawerContent className="sm:max-w-2xl max-h-[92vh]">
        <DrawerHeader className="border-b">
          <div className="flex items-start justify-between">
            <div>
              <DrawerTitle className="text-base flex items-center gap-2">
                <span className="font-mono">{order.orderNo}</span>
                <StatusBadge status={order.status} />
                <StatusBadge status={order.paymentStatus} />
              </DrawerTitle>
              <p className="text-xs text-muted-foreground mt-1">{order.customer.businessName} · {fmtDateTime(order.createdAt)}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>
        </DrawerHeader>
        <ScrollArea className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-4">
            {/* Workflow */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40">
              {['pending', 'packed', 'dispatched', 'delivered'].map((s, i) => {
                const cur = ['pending', 'packed', 'dispatched', 'delivered'].indexOf(order.status)
                const isDone = i <= cur && order.status !== 'cancelled'
                return (
                  <div key={s} className="flex items-center gap-2 flex-1">
                    <div className={cn('flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold', isDone ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground')}>{i + 1}</div>
                    <span className={cn('text-xs capitalize', isDone ? 'font-medium' : 'text-muted-foreground')}>{s}</span>
                    {i < 3 && <div className={cn('h-px flex-1', isDone && i < cur ? 'bg-emerald-500' : 'bg-border')} />}
                  </div>
                )
              })}
            </div>

            {/* Items */}
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-medium uppercase text-muted-foreground">Item</th>
                    <th className="text-right px-3 py-2 text-xs font-medium uppercase text-muted-foreground">Qty</th>
                    <th className="text-right px-3 py-2 text-xs font-medium uppercase text-muted-foreground">Price</th>
                    <th className="text-right px-3 py-2 text-xs font-medium uppercase text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((it) => (
                    <tr key={it.id} className="border-t">
                      <td className="px-3 py-2">
                        <p className="text-sm font-medium">{it.product.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{it.product.sku}</p>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{it.quantity}</td>
                      <td className="px-3 py-2 text-right tabular-nums">₹{it.unitPrice.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium">₹{it.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="ml-auto w-64 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{fmtINR(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">GST (5%)</span><span className="tabular-nums">{fmtINR(order.tax)}</span></div>
              {order.discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="tabular-nums text-rose-600">-{fmtINR(order.discount)}</span></div>}
              <div className="flex justify-between font-semibold pt-2 border-t"><span>Total</span><span className="tabular-nums">{fmtINR(order.total)}</span></div>
              <div className="flex justify-between text-emerald-600"><span>Paid</span><span className="tabular-nums">{fmtINR(order.paid)}</span></div>
              <div className="flex justify-between text-rose-600 font-medium"><span>Balance</span><span className="tabular-nums">{fmtINR(order.total - order.paid)}</span></div>
              <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t"><span>Profit</span><span className="tabular-nums text-emerald-600">{fmtINR(order.profit)}</span></div>
            </div>
          </div>
        </ScrollArea>
        <DrawerFooter className="border-t pt-4 flex-row justify-between gap-2">
          <div className="flex gap-2">
            {order.status !== 'cancelled' && order.status !== 'delivered' && (
              <Button variant="outline" size="sm" onClick={() => onCancel(order.id)} className="text-rose-600"><X className="h-4 w-4" /> Cancel Order</Button>
            )}
          </div>
          <div className="flex gap-2">
            {invoice && (
              <Button variant="outline" size="sm" onClick={() => window.open(`/api/invoices/${invoice.id}/pdf`, '_blank')}>
                <FileText className="h-4 w-4" /> Print Invoice
              </Button>
            )}
            {next && (
              <Button size="sm" onClick={() => onAdvance(order.id)}>
                <ArrowRight className="h-4 w-4" /> Mark as {next}
              </Button>
            )}
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
