'use client'
import { useState } from 'react'
import { PageHeader } from '@/shared/components/page-header'
import { DataTable, type Column } from '@/shared/components/data-table'
import { KPICard } from '@/shared/components/kpi-card'
import { Badge } from '@/shared/components/status-badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ArrowLeftRight, ArrowDownLeft, ArrowUpRight, AlertTriangle, Package, Download } from 'lucide-react'
import { fmtDateTime, exportCSV, exportXLSX } from '@/shared/lib/format'

export function StockMovementsModule() {
  const [movements, setMovements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useState(() => {
    fetch('/api/inventory/movements')
      .then((r) => r.json())
      .then((m) => setMovements(m))
      .catch(() => {})
      .finally(() => setLoading(false))
  })

  const stockIn = movements.filter((m) => m.type === 'stock_in')
  const stockOut = movements.filter((m) => m.type === 'stock_out')
  const returns = movements.filter((m) => m.type === 'return')
  const adjustments = movements.filter((m) => ['damaged', 'lost', 'expired', 'adjustment'].includes(m.type))

  const typeConfig: Record<string, { icon: any; color: string; label: string }> = {
    stock_in: { icon: ArrowDownLeft, color: 'text-emerald-600', label: 'Stock In' },
    stock_out: { icon: ArrowUpRight, color: 'text-rose-600', label: 'Stock Out' },
    return: { icon: ArrowLeftRight, color: 'text-sky-600', label: 'Return' },
    damaged: { icon: AlertTriangle, color: 'text-amber-600', label: 'Damaged' },
    lost: { icon: AlertTriangle, color: 'text-rose-600', label: 'Lost' },
    expired: { icon: AlertTriangle, color: 'text-rose-600', label: 'Expired' },
    adjustment: { icon: ArrowLeftRight, color: 'text-violet-600', label: 'Adjustment' },
    reserved: { icon: Package, color: 'text-amber-600', label: 'Reserved' },
    released: { icon: Package, color: 'text-emerald-600', label: 'Released' },
  }

  const columns: Column<any>[] = [
    {
      key: 'createdAt', header: 'Date/Time', sortable: true, sortAccessor: (m) => m.createdAt,
      cell: (m) => <span className="text-xs text-muted-foreground">{fmtDateTime(m.createdAt)}</span>,
    },
    {
      key: 'type', header: 'Type', align: 'center',
      cell: (m) => {
        const cfg = typeConfig[m.type] ?? typeConfig.adjustment
        return (
          <div className="flex items-center justify-center gap-1.5">
            <cfg.icon className={`h-3.5 w-3.5 ${cfg.color}`} />
            <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
          </div>
        )
      },
    },
    {
      key: 'product', header: 'Product', sortable: true, sortAccessor: (m) => m.product?.name ?? '',
      cell: (m) => (
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{m.product?.name ?? '—'}</p>
          <p className="text-xs text-muted-foreground font-mono">{m.product?.sku}</p>
        </div>
      ),
    },
    {
      key: 'quantity', header: 'Qty', align: 'right', sortable: true,
      cell: (m) => {
        const isIn = m.type === 'stock_in' || m.type === 'return' || m.type === 'released'
        return (
          <span className={`tabular-nums font-medium ${isIn ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isIn ? '+' : '-'}{m.quantity}
          </span>
        )
      },
    },
    {
      key: 'refType', header: 'Source', align: 'center',
      cell: (m) => m.refType ? <Badge variant="outline" className="capitalize">{m.refType}</Badge> : <span className="text-xs text-muted-foreground">—</span>,
    },
    {
      key: 'note', header: 'Note',
      cell: (m) => <span className="text-xs text-muted-foreground truncate max-w-[250px] block">{m.note ?? '—'}</span>,
    },
    {
      key: 'user', header: 'By',
      cell: (m) => <span className="text-xs">{m.user?.name ?? 'System'}</span>,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Movements Log"
        description={`${movements.length} movements · Complete audit trail of all stock changes`}
        icon={ArrowLeftRight}
        accent="info"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => exportCSV('stock-movements.csv', movements)}>
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportXLSX('stock-movements.xlsx', movements, 'Stock Movements')}>
              <Download className="h-4 w-4" /> Excel
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Total Movements" value={String(movements.length)} icon={ArrowLeftRight} accent="info" sublabel="All time" />
        <KPICard label="Stock In" value={String(stockIn.length)} icon={ArrowDownLeft} accent="success" sublabel="Receipts" />
        <KPICard label="Stock Out" value={String(stockOut.length)} icon={ArrowUpRight} accent="danger" sublabel="Issues" />
        <KPICard label="Adjustments" value={String(adjustments.length)} icon={AlertTriangle} accent="warning" sublabel="Damaged/Lost/Expired" />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({movements.length})</TabsTrigger>
          <TabsTrigger value="in">Stock In ({stockIn.length})</TabsTrigger>
          <TabsTrigger value="out">Stock Out ({stockOut.length})</TabsTrigger>
          <TabsTrigger value="returns">Returns ({returns.length})</TabsTrigger>
          <TabsTrigger value="adjustments">Adjustments ({adjustments.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <DataTable data={movements} columns={columns} loading={loading} pageSize={15} searchPlaceholder="Search movements..." />
        </TabsContent>
        <TabsContent value="in" className="mt-4">
          <DataTable data={stockIn} columns={columns} loading={loading} pageSize={15} searchPlaceholder="Search stock in..." />
        </TabsContent>
        <TabsContent value="out" className="mt-4">
          <DataTable data={stockOut} columns={columns} loading={loading} pageSize={15} searchPlaceholder="Search stock out..." />
        </TabsContent>
        <TabsContent value="returns" className="mt-4">
          <DataTable data={returns} columns={columns} loading={loading} pageSize={15} searchPlaceholder="Search returns..." />
        </TabsContent>
        <TabsContent value="adjustments" className="mt-4">
          <DataTable data={adjustments} columns={columns} loading={loading} pageSize={15} searchPlaceholder="Search adjustments..." />
        </TabsContent>
      </Tabs>
    </div>
  )
}
