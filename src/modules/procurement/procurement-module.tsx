'use client'
import { useState } from 'react'
import { PageHeader } from '@/shared/components/page-header'
import { DataTable, type Column } from '@/shared/components/data-table'
import { KPICard } from '@/shared/components/kpi-card'
import { Badge, StatusBadge } from '@/shared/components/status-badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Truck, ShoppingCart, IndianRupee, Star, Plus, Download, Phone, Clock, TrendingUp, UserPlus } from 'lucide-react'
import { fmtINR, fmtDate, fmtNumber, exportCSV } from '@/shared/lib/format'
import { useSuppliers, usePurchaseOrders } from '@/shared/services/mutations'
import { NewPODrawer } from './new-po-drawer'
import { SupplierFormDrawer } from './supplier-form-drawer'
import { Can } from '@/shared/hooks/use-permission'
import type { Supplier, PurchaseOrder } from '@/shared/types'

export function ProcurementModule() {
  const { data: suppliers = [], isLoading: loadingSup } = useSuppliers()
  const { data: pos = [], isLoading: loadingPOs } = usePurchaseOrders()
  const loading = loadingSup || loadingPOs
  const [poOpen, setPoOpen] = useState(false)
  const [supplierOpen, setSupplierOpen] = useState(false)

  const totalSpent = pos.reduce((s, p) => s + p.total, 0)
  const pending = pos.filter((p) => p.status === 'sent' || p.status === 'partial').length
  const totalPayable = suppliers.reduce((s, x) => s + x.outstanding, 0)
  const avgLeadTime = suppliers.length ? suppliers.reduce((s, x) => s + x.leadTimeDays, 0) / suppliers.length : 0

  const supplierColumns: Column<Supplier>[] = [
    {
      key: 'name', header: 'Supplier', sortable: true,
      cell: (s) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-gradient-to-br from-sky-500 to-indigo-500 text-white text-xs">
              {s.name.split(' ').slice(0, 2).map((n) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{s.name}</p>
            <p className="text-xs text-muted-foreground">{s.contactPerson} · {s.district}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone', header: 'Contact',
      cell: (s) => <span className="text-xs font-mono">{s.phone}</span>,
    },
    {
      key: 'rating', header: 'Rating', align: 'center', sortable: true,
      cell: (s) => (
        <div className="flex items-center justify-center gap-1">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          <span className="text-sm tabular-nums">{s.rating.toFixed(1)}</span>
        </div>
      ),
    },
    {
      key: 'leadTimeDays', header: 'Lead Time', align: 'center', sortable: true,
      cell: (s) => <span className="text-sm tabular-nums">{s.leadTimeDays}d</span>,
    },
    {
      key: 'totalPurchased', header: 'Total Bought', align: 'right', sortable: true,
      cell: (s) => <span className="tabular-nums text-sm">{fmtINR(s.totalPurchased, true)}</span>,
    },
    {
      key: 'outstanding', header: 'Payable', align: 'right', sortable: true,
      cell: (s) => <span className={`tabular-nums text-sm ${s.outstanding > 0 ? 'text-rose-600 dark:text-rose-400 font-medium' : ''}`}>{fmtINR(s.outstanding, true)}</span>,
    },
    {
      key: 'onTimeRate', header: 'On-Time', align: 'center',
      cell: (s) => (
        <div className="flex flex-col items-center">
          <span className="text-sm tabular-nums">{s.onTimeRate.toFixed(0)}%</span>
          <div className="h-1 w-12 rounded-full bg-muted overflow-hidden mt-1">
            <div className="h-full bg-emerald-500" style={{ width: `${s.onTimeRate}%` }} />
          </div>
        </div>
      ),
    },
    {
      key: 'status', header: 'Status', align: 'center',
      cell: (s) => <StatusBadge status={s.status} />,
    },
  ]

  const poColumns: Column<PurchaseOrder>[] = [
    {
      key: 'poNo', header: 'PO #', sortable: true,
      cell: (p) => <span className="font-mono text-xs font-medium">{p.poNo}</span>,
    },
    {
      key: 'supplier', header: 'Supplier', sortable: true, sortAccessor: (p) => p.supplier.name,
      cell: (p) => <span className="text-sm">{p.supplier.name}</span>,
    },
    {
      key: 'warehouse', header: 'Warehouse',
      cell: (p) => <span className="text-xs font-mono">{p.warehouse.code}</span>,
    },
    {
      key: 'total', header: 'Total', align: 'right', sortable: true,
      cell: (p) => <span className="tabular-nums text-sm font-medium">{fmtINR(p.total)}</span>,
    },
    {
      key: 'paid', header: 'Paid', align: 'right', sortable: true,
      cell: (p) => <span className="tabular-nums text-sm text-emerald-600 dark:text-emerald-400">{fmtINR(p.paid)}</span>,
    },
    {
      key: 'expectedAt', header: 'Expected', sortable: true,
      cell: (p) => <span className="text-xs text-muted-foreground">{fmtDate(p.expectedAt)}</span>,
    },
    {
      key: 'receivedAt', header: 'Received', sortable: true,
      cell: (p) => <span className="text-xs text-muted-foreground">{fmtDate(p.receivedAt)}</span>,
    },
    {
      key: 'status', header: 'Status', align: 'center',
      cell: (p) => <StatusBadge status={p.status} />,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Procurement"
        description="Suppliers, purchase orders, GRN, supplier performance"
        icon={Truck}
        accent="info"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => exportCSV('purchase-orders.csv', pos as any)}><Download className="h-4 w-4" /> Export</Button>
            <Can module="procurement" action="create">
              <Button variant="outline" size="sm" onClick={() => setSupplierOpen(true)}><UserPlus className="h-4 w-4" /> Add Supplier</Button>
              <Button size="sm" onClick={() => setPoOpen(true)}><Plus className="h-4 w-4" /> New PO</Button>
            </Can>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Total Procured" value={fmtINR(totalSpent, true)} icon={IndianRupee} accent="primary" sublabel={`${pos.length} purchase orders`} />
        <KPICard label="Pending POs" value={fmtNumber(pending)} icon={Clock} accent="warning" sublabel="Awaiting delivery" />
        <KPICard label="Total Payable" value={fmtINR(totalPayable, true)} icon={TrendingUp} accent="danger" sublabel="To suppliers" />
        <KPICard label="Avg Lead Time" value={`${avgLeadTime.toFixed(0)}d`} icon={Truck} accent="success" sublabel="Across all suppliers" />
      </div>

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Purchase Orders ({pos.length})</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers ({suppliers.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="orders" className="mt-4">
          <DataTable data={pos} columns={poColumns} loading={loading} pageSize={12} searchPlaceholder="Search POs..." />
        </TabsContent>
        <TabsContent value="suppliers" className="mt-4">
          <DataTable data={suppliers} columns={supplierColumns} loading={loading} pageSize={12} searchPlaceholder="Search suppliers..." />
        </TabsContent>
      </Tabs>

      <NewPODrawer open={poOpen} onOpenChange={setPoOpen} />
      <SupplierFormDrawer open={supplierOpen} onOpenChange={setSupplierOpen} />
    </div>
  )
}
