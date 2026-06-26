'use client'
import { useEffect, useState } from 'react'
import { api } from '@/shared/services/api'
import { PageHeader } from '@/shared/components/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/shared/components/status-badge'
import { FileText, Download, FileSpreadsheet, File as FileIcon, Calendar, IndianRupee, TrendingUp, Package, Users, ShoppingCart } from 'lucide-react'
import { exportCSV, exportJSON, fmtINR } from '@/shared/lib/format'
import { useApp } from '@/shared/lib/store'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const REPORTS = [
  { id: 'daily-sales', name: 'Daily Sales Report', desc: 'Today\'s orders, revenue, top SKUs', icon: TrendingUp, color: 'primary', period: 'Daily' },
  { id: 'weekly-sales', name: 'Weekly Sales Report', desc: 'Last 7 days sales summary', icon: TrendingUp, color: 'success', period: 'Weekly' },
  { id: 'monthly-sales', name: 'Monthly Sales Report', desc: 'Last 30 days comprehensive sales', icon: Calendar, color: 'info', period: 'Monthly' },
  { id: 'inventory', name: 'Inventory Report', desc: 'Stock levels, valuation, batches', icon: Package, color: 'warning', period: 'Current' },
  { id: 'profit', name: 'Profit Analysis', desc: 'Revenue, COGS, GP, NP by SKU/customer', icon: IndianRupee, color: 'violet', period: 'Monthly' },
  { id: 'gst', name: 'GST Report', desc: 'GST collected & payable', icon: FileText, color: 'primary', period: 'Monthly' },
  { id: 'customer', name: 'Customer Report', desc: 'LTV, outstanding, risk scores', icon: Users, color: 'info', period: 'Current' },
  { id: 'supplier', name: 'Supplier Report', desc: 'PO history, performance, payable', icon: ShoppingCart, color: 'success', period: 'Monthly' },
  { id: 'warehouse', name: 'Warehouse Report', desc: 'Stock movements, dispatch, returns', icon: Package, color: 'warning', period: 'Weekly' },
]

export function ReportsModule() {
  const { toast } = useToast()
  const [data, setData] = useState<any>({})

  useEffect(() => {
    Promise.all([
      api.salesOrders(), api.customers(), api.products(), api.inventory(),
      api.suppliers(), api.purchaseOrders(), api.expenses(), api.pnl(),
    ]).then(([o, c, p, i, s, po, e, pnl]) => {
      setData({ orders: o, customers: c, products: p, inventory: i, suppliers: s, pos: po, expenses: e, pnl })
    }).catch(() => {})
  }, [])

  const exportReport = (id: string, format: 'csv' | 'json') => {
    const report = REPORTS.find((r) => r.id === id)!
    let payload: any[] = []
    if (id.includes('sales')) payload = data.orders?.map((o: any) => ({ orderNo: o.orderNo, customer: o.customer.businessName, date: o.createdAt, status: o.status, payment: o.paymentStatus, total: o.total, profit: o.profit })) ?? []
    else if (id === 'inventory') payload = data.inventory?.map((i: any) => ({ sku: i.product.sku, product: i.product.name, warehouse: i.warehouse.code, stock: i.currentStock, reorder: i.reorderLevel, value: i.valuation, abc: i.product.abcClass })) ?? []
    else if (id === 'customer') payload = data.customers?.map((c: any) => ({ business: c.businessName, area: c.area, status: c.status, outstanding: c.outstanding, ltv: c.lifetimeValue, risk: c.riskScore })) ?? []
    else if (id === 'supplier') payload = data.suppliers?.map((s: any) => ({ name: s.name, district: s.district, rating: s.rating, leadTime: s.leadTimeDays, outstanding: s.outstanding, total: s.totalPurchased })) ?? []
    else if (id === 'profit') payload = data.pnl?.breakdown ?? []
    else if (id === 'gst') payload = data.orders?.filter((o: any) => o.status !== 'cancelled').map((o: any) => ({ orderNo: o.orderNo, customer: o.customer.businessName, taxable: o.subtotal, gst: o.tax, total: o.total, date: o.createdAt })) ?? []
    else if (id === 'warehouse') payload = data.inventory?.map((i: any) => ({ sku: i.product.sku, warehouse: i.warehouse.code, current: i.currentStock, reserved: i.reservedStock, incoming: i.incomingStock })) ?? []
    if (payload.length === 0) {
      toast({ title: 'No data', description: 'No data available for this report', variant: 'destructive' })
      return
    }
    const filename = `${id}-${new Date().toISOString().slice(0, 10)}.${format}`
    if (format === 'csv') exportCSV(filename, payload)
    else exportJSON(filename, payload)
    toast({ title: `Exported ${report.name}`, description: `${filename} · ${payload.length} rows` })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate PDF, Excel, CSV reports — Daily, Weekly, Monthly, Quarterly, Annual"
        icon={FileText}
        accent="info"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => {
          const a = {
            primary: 'bg-orange-500/10 text-orange-600',
            success: 'bg-emerald-500/10 text-emerald-600',
            warning: 'bg-amber-500/10 text-amber-600',
            info: 'bg-sky-500/10 text-sky-600',
            violet: 'bg-violet-500/10 text-violet-600',
          }
          return (
            <Card key={r.id} className="p-5 shadow-soft hover:shadow-soft-md transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', a[r.color as keyof typeof a])}>
                  <r.icon className="h-5 w-5" />
                </div>
                <Badge variant="outline">{r.period}</Badge>
              </div>
              <h3 className="text-sm font-semibold">{r.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4">{r.desc}</p>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="flex-1 h-8" onClick={() => exportReport(r.id, 'csv')}>
                  <FileSpreadsheet className="h-3.5 w-3.5" /> CSV
                </Button>
                <Button size="sm" variant="outline" className="flex-1 h-8" onClick={() => exportReport(r.id, 'json')}>
                  <Download className="h-3.5 w-3.5" /> JSON
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      <Card className="p-5 shadow-soft">
        <h3 className="text-sm font-semibold mb-3">Quick Exports</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Button variant="outline" className="justify-start h-12" onClick={() => exportCSV('all-orders.csv', (data.orders ?? []).map((o: any) => ({ orderNo: o.orderNo, customer: o.customer.businessName, total: o.total, status: o.status, date: o.createdAt })))}>
            <ShoppingCart className="h-4 w-4 text-orange-500" /> All Orders ({data.orders?.length ?? 0})
          </Button>
          <Button variant="outline" className="justify-start h-12" onClick={() => exportCSV('all-customers.csv', (data.customers ?? []).map((c: any) => ({ business: c.businessName, area: c.area, status: c.status, outstanding: c.outstanding })))}>
            <Users className="h-4 w-4 text-sky-500" /> All Customers ({data.customers?.length ?? 0})
          </Button>
          <Button variant="outline" className="justify-start h-12" onClick={() => exportCSV('all-products.csv', (data.products ?? []).map((p: any) => ({ sku: p.sku, name: p.name, mrp: p.mrp, margin: p.marginPercent })))}>
            <Package className="h-4 w-4 text-amber-500" /> All Products ({data.products?.length ?? 0})
          </Button>
        </div>
      </Card>
    </div>
  )
}
