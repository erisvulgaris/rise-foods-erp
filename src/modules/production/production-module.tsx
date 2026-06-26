'use client'
import { useEffect, useState } from 'react'
import { api } from '@/shared/services/api'
import { PageHeader } from '@/shared/components/page-header'
import { DataTable, type Column } from '@/shared/components/data-table'
import { KPICard } from '@/shared/components/kpi-card'
import { Card } from '@/components/ui/card'
import { Badge, StatusBadge } from '@/shared/components/status-badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Factory, Package, TrendingDown, Activity, Settings as SettingsIcon, Gauge, Boxes } from 'lucide-react'
import { fmtINR, fmtDate, fmtNumber } from '@/shared/lib/format'
import { BarChartCard, RadialProgress } from '@/shared/components/charts'
import type { ProductionBatch } from '@/shared/types'

export function ProductionModule() {
  const [batches, setBatches] = useState<ProductionBatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.productionBatches().then(setBatches).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const avgYield = batches.length ? batches.reduce((s, b) => s + b.yieldPercent, 0) / batches.length : 0
  const avgLoss = batches.length ? batches.reduce((s, b) => s + b.lossPercent, 0) / batches.length : 0
  const totalCost = batches.reduce((s, b) => s + b.cost, 0)
  const finished = batches.filter((b) => b.stage === 'finished').length
  const totalDowntime = batches.reduce((s, b) => s + b.downtime, 0)

  const stageColors: Record<string, any> = {
    cleaning: 'info', grinding: 'warning', packing: 'violet', finished: 'success', qc: 'info',
  }

  const columns: Column<ProductionBatch>[] = [
    {
      key: 'batchNo', header: 'Batch #', sortable: true,
      cell: (b) => <span className="font-mono text-xs">{b.batchNo}</span>,
    },
    {
      key: 'product', header: 'Product',
      cell: (b) => <span className="text-sm">{b.product?.name ?? '—'}</span>,
    },
    {
      key: 'startDate', header: 'Start', sortable: true,
      cell: (b) => <span className="text-xs text-muted-foreground">{fmtDate(b.startDate)}</span>,
    },
    {
      key: 'inputQty', header: 'Input', align: 'right', sortable: true,
      cell: (b) => <span className="tabular-nums">{fmtNumber(b.inputQty)}</span>,
    },
    {
      key: 'outputQty', header: 'Output', align: 'right', sortable: true,
      cell: (b) => <span className="tabular-nums">{fmtNumber(b.outputQty)}</span>,
    },
    {
      key: 'yieldPercent', header: 'Yield', align: 'right', sortable: true,
      cell: (b) => (
        <div className="flex items-center justify-end gap-2">
          <span className="tabular-nums text-sm font-medium text-emerald-600 dark:text-emerald-400">{b.yieldPercent.toFixed(1)}%</span>
        </div>
      ),
    },
    {
      key: 'lossPercent', header: 'Loss', align: 'right', sortable: true,
      cell: (b) => <span className="tabular-nums text-sm text-rose-600 dark:text-rose-400">{b.lossPercent.toFixed(1)}%</span>,
    },
    {
      key: 'machineName', header: 'Machine',
      cell: (b) => <Badge variant="outline">{b.machineName ?? '—'}</Badge>,
    },
    {
      key: 'operator', header: 'Operator',
      cell: (b) => <span className="text-xs">{b.operator?.name ?? '—'}</span>,
    },
    {
      key: 'stage', header: 'Stage', align: 'center',
      cell: (b) => <StatusBadge status={b.stage} />,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Production"
        description="Batch tracking, yield, loss %, machine, operator, downtime"
        icon={Factory}
        accent="warning"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Avg Yield" value={`${avgYield.toFixed(1)}%`} icon={Gauge} accent="success" sublabel={`${batches.length} batches`} />
        <KPICard label="Avg Loss" value={`${avgLoss.toFixed(1)}%`} icon={TrendingDown} accent="danger" sublabel="Processing loss" />
        <KPICard label="Total Cost" value={fmtINR(totalCost, true)} icon={Factory} accent="primary" sublabel="Production costs" />
        <KPICard label="Finished Batches" value={fmtNumber(finished)} icon={Package} accent="info" sublabel={`${totalDowntime} min downtime`} />
      </div>

      <Card className="p-5 shadow-soft">
        <h3 className="text-sm font-semibold mb-3">Yield by Batch</h3>
        <BarChartCard
          data={batches.map((b) => ({ label: b.batchNo.split('-').pop() ?? b.batchNo, yield: b.yieldPercent, loss: b.lossPercent }))}
          xKey="label"
          yKeys={[{ key: 'yield', label: 'Yield %', color: 'var(--chart-2)' }, { key: 'loss', label: 'Loss %', color: 'var(--chart-5)' }]}
          height={220}
          showLegend
          formatter={(v) => `${v.toFixed(1)}%`}
        />
      </Card>

      <DataTable data={batches} columns={columns} loading={loading} pageSize={10} searchPlaceholder="Search batches..." />
    </div>
  )
}

// Warehouse module (compact — same component pattern)
export function WarehouseModule() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouse Operations"
        description="Receiving, packing, dispatch, returns, cycle count, audit"
        icon={Boxes}
        accent="info"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 shadow-soft lg:col-span-2">
          <h3 className="text-sm font-semibold mb-1">Operations Status</h3>
          <p className="text-xs text-muted-foreground mb-4">Today's warehouse activity</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Receiving', value: 3, color: 'success' },
              { label: 'Packing', value: 5, color: 'warning' },
              { label: 'Dispatch', value: 2, color: 'info' },
              { label: 'Returns', value: 1, color: 'danger' },
            ].map((x) => (
              <div key={x.label} className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">{x.label}</p>
                <p className="text-2xl font-semibold tabular-nums mt-1">{x.value}</p>
                <Badge variant={x.color as any} className="mt-1">In progress</Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5 shadow-soft">
          <h3 className="text-sm font-semibold mb-3">Cycle Count Progress</h3>
          <div className="flex items-center justify-around py-4">
            <RadialProgress value={68} label="Complete" size={120} color="var(--chart-2)" />
          </div>
          <p className="text-xs text-muted-foreground text-center">17 of 25 racks counted · 2 discrepancies found</p>
        </Card>
      </div>

      <Card className="p-5 shadow-soft">
        <h3 className="text-sm font-semibold mb-3">Loading Docks</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {['Dock 1', 'Dock 2', 'Dock 3', 'Dock 4'].map((dock, i) => (
            <div key={dock} className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">{dock}</p>
                <Badge variant={i === 0 ? 'success' : i === 1 ? 'warning' : 'outline'}>
                  {i === 0 ? 'Loading' : i === 1 ? 'Waiting' : 'Idle'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{i < 2 ? `DSP-2026-${1000 + i}` : 'Available'}</p>
              <p className="text-xs text-muted-foreground">{i < 2 ? `Basti · ETA 4:30 PM` : 'Ready for assignment'}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
