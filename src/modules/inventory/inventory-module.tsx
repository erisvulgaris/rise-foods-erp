'use client'
import { useEffect, useState } from 'react'
import { api } from '@/shared/services/api'
import { PageHeader } from '@/shared/components/page-header'
import { DataTable, type Column } from '@/shared/components/data-table'
import { KPICard } from '@/shared/components/kpi-card'
import { Badge, StatusBadge } from '@/shared/components/status-badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Warehouse, Boxes, AlertTriangle, Calendar, Download, Plus, PackageCheck, TrendingDown } from 'lucide-react'
import { fmtINR, fmtNumber, fmtDate, exportCSV, abcColor, daysUntil, cn } from '@/shared/lib/format'
import type { Inventory, Batch } from '@/shared/types'

export function InventoryModule() {
  const [inventory, setInventory] = useState<Inventory[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.inventory(), api.batches()])
      .then(([i, b]) => { setInventory(i); setBatches(b) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const totalValue = inventory.reduce((s, i) => s + i.valuation, 0)
  const lowStock = inventory.filter((i) => i.currentStock <= i.reorderLevel)
  const expiringSoon = batches.filter((b) => {
    const days = daysUntil(b.expiryDate)
    return days <= 30 && days >= 0 && b.status !== 'expired'
  })
  const expired = batches.filter((b) => b.status === 'expired' || daysUntil(b.expiryDate) < 0)

  const columns: Column<Inventory>[] = [
    {
      key: 'product', header: 'Product', sortable: true, sortAccessor: (i) => i.product.name,
      cell: (i) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
            <Boxes className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{i.product.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{i.product.sku} · {i.product.packagingSize}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'warehouse', header: 'Warehouse', sortable: true, sortAccessor: (i) => i.warehouse.code,
      cell: (i) => <span className="text-xs font-mono">{i.warehouse.code}</span>,
    },
    {
      key: 'currentStock', header: 'Stock', align: 'right', sortable: true,
      cell: (i) => {
        const isLow = i.currentStock <= i.reorderLevel
        return (
          <div className="text-right">
            <p className={cn('text-sm font-semibold tabular-nums', isLow && 'text-rose-600 dark:text-rose-400')}>{fmtNumber(i.currentStock)}</p>
            <p className="text-[10px] text-muted-foreground">+{i.incomingStock} incoming</p>
          </div>
        )
      },
    },
    {
      key: 'reserved', header: 'Reserved', align: 'right',
      cell: (i) => <span className="text-xs tabular-nums text-muted-foreground">{i.reservedStock}</span>,
    },
    {
      key: 'reorderLevel', header: 'Reorder', align: 'right', sortable: true,
      cell: (i) => <span className="text-xs tabular-nums">{i.reorderLevel}</span>,
    },
    {
      key: 'valuation', header: 'Value', align: 'right', sortable: true,
      cell: (i) => <span className="tabular-nums text-sm font-medium">{fmtINR(i.valuation, true)}</span>,
    },
    {
      key: 'abcClass', header: 'ABC', align: 'center',
      cell: (i) => <span className={abcColor(i.product.abcClass)}>{i.product.abcClass}</span>,
    },
    {
      key: 'status', header: 'Status', align: 'center',
      cell: (i) => {
        const isLow = i.currentStock <= i.reorderLevel
        const isCritical = i.currentStock <= i.reorderLevel * 0.5
        return <StatusBadge status={isCritical ? 'critical' : isLow ? 'warning' : 'in_stock'} />
      },
    },
  ]

  const batchColumns: Column<Batch>[] = [
    {
      key: 'batchNo', header: 'Batch No', sortable: true,
      cell: (b) => <span className="font-mono text-xs">{b.batchNo}</span>,
    },
    {
      key: 'product', header: 'Product', sortable: true, sortAccessor: (b) => b.product.name,
      cell: (b) => <div><p className="text-sm font-medium">{b.product.name}</p><p className="text-xs text-muted-foreground font-mono">{b.product.sku}</p></div>,
    },
    {
      key: 'quantity', header: 'Qty', align: 'right', sortable: true,
      cell: (b) => <span className="tabular-nums">{fmtNumber(b.quantity)}</span>,
    },
    {
      key: 'mfgDate', header: 'Mfg Date', sortable: true, sortAccessor: (b) => b.mfgDate,
      cell: (b) => <span className="text-xs text-muted-foreground">{fmtDate(b.mfgDate)}</span>,
    },
    {
      key: 'expiryDate', header: 'Expiry', sortable: true, sortAccessor: (b) => b.expiryDate,
      cell: (b) => {
        const days = daysUntil(b.expiryDate)
        const danger = days < 0
        const warn = days >= 0 && days <= 30
        return (
          <div className="text-right">
            <p className="text-xs">{fmtDate(b.expiryDate)}</p>
            <p className={cn('text-[10px] font-medium', danger ? 'text-rose-500' : warn ? 'text-amber-500' : 'text-muted-foreground')}>
              {danger ? `Expired ${Math.abs(days)}d ago` : `${days}d left`}
            </p>
          </div>
        )
      },
    },
    {
      key: 'supplier', header: 'Supplier',
      cell: (b) => <span className="text-xs">{b.supplier?.name ?? '—'}</span>,
    },
    {
      key: 'status', header: 'Status', align: 'center',
      cell: (b) => <StatusBadge status={b.status} />,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Management"
        description="Stock levels, batch tracking, FIFO, expiry management"
        icon={Warehouse}
        accent="info"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => exportCSV('inventory.csv', inventory as any)}>
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button size="sm"><Plus className="h-4 w-4" /> Stock Adjustment</Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Inventory Value" value={fmtINR(totalValue, true)} icon={Boxes} accent="primary" sublabel={`${inventory.length} SKUs across 2 warehouses`} />
        <KPICard label="Low Stock" value={fmtNumber(lowStock.length)} icon={AlertTriangle} accent="warning" sublabel="SKUs at or below reorder level" />
        <KPICard label="Expiring <30d" value={fmtNumber(expiringSoon.length)} icon={Calendar} accent="warning" sublabel="Batches need clearance" />
        <KPICard label="Expired" value={fmtNumber(expired.length)} icon={TrendingDown} accent="danger" sublabel="Remove from stock" />
      </div>

      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock">Stock Levels ({inventory.length})</TabsTrigger>
          <TabsTrigger value="batches">Batches ({batches.length})</TabsTrigger>
          <TabsTrigger value="alerts">Alerts ({lowStock.length + expiringSoon.length + expired.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="mt-4">
          <DataTable
            data={inventory}
            columns={columns}
            loading={loading}
            pageSize={12}
            searchPlaceholder="Search by SKU, product name..."
          />
        </TabsContent>

        <TabsContent value="batches" className="mt-4">
          <DataTable
            data={batches}
            columns={batchColumns}
            loading={loading}
            pageSize={12}
            searchPlaceholder="Search by batch no, product..."
          />
        </TabsContent>

        <TabsContent value="alerts" className="mt-4 space-y-4">
          {lowStock.length > 0 && (
            <Card className="p-5 shadow-soft border-amber-500/30">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-semibold">Low Stock Alerts</h3>
                <Badge variant="warning">{lowStock.length}</Badge>
              </div>
              <div className="space-y-2">
                {lowStock.map((i) => (
                  <div key={i.id} className="flex items-center justify-between p-2.5 rounded-lg border bg-amber-500/5">
                    <div>
                      <p className="text-sm font-medium">{i.product.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{i.product.sku} · {i.warehouse.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">{i.currentStock} / {i.reorderLevel}</p>
                      <p className="text-[10px] text-muted-foreground">Suggest PO: {i.reorderQty} units</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {expiringSoon.length > 0 && (
            <Card className="p-5 shadow-soft border-amber-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-semibold">Expiring Soon (≤30 days)</h3>
                <Badge variant="warning">{expiringSoon.length}</Badge>
              </div>
              <div className="space-y-2">
                {expiringSoon.map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-2.5 rounded-lg border bg-amber-500/5">
                    <div>
                      <p className="text-sm font-medium">{b.product.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{b.batchNo} · {fmtNumber(b.quantity)} units</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">{daysUntil(b.expiryDate)}d left</p>
                      <p className="text-[10px] text-muted-foreground">Clearance promo suggested</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {expired.length > 0 && (
            <Card className="p-5 shadow-soft border-rose-500/30">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="h-4 w-4 text-rose-500" />
                <h3 className="text-sm font-semibold">Expired Batches</h3>
                <Badge variant="danger">{expired.length}</Badge>
              </div>
              <div className="space-y-2">
                {expired.map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-2.5 rounded-lg border bg-rose-500/5">
                    <div>
                      <p className="text-sm font-medium">{b.product.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{b.batchNo} · {fmtNumber(b.quantity)} units</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">Expired</p>
                      <p className="text-[10px] text-muted-foreground">Remove from stock</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
