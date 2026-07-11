'use client'
import { useState } from 'react'
import { PageHeader } from '@/shared/components/page-header'
import { DataTable, type Column } from '@/shared/components/data-table'
import { KPICard } from '@/shared/components/kpi-card'
import { StatusBadge, Badge } from '@/shared/components/status-badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { MapPin, Calendar, Clock, Plus, IndianRupee, TrendingUp, Download } from 'lucide-react'
import { fmtINR, fmtDate, fmtDateTime, exportCSV, exportXLSX } from '@/shared/lib/format'
import { useToast } from '@/hooks/use-toast'

export function VisitsModule() {
  const [visits, setVisits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useState(() => {
    fetch('/api/visits')
      .then((r) => r.json())
      .then((v) => setVisits(v))
      .catch(() => {})
      .finally(() => setLoading(false))
  })

  const completed = visits.filter((v) => v.status === 'completed')
  const planned = visits.filter((v) => v.status === 'planned')
  const missed = visits.filter((v) => v.status === 'missed')
  const totalOrderValue = visits.reduce((s, v) => s + (v.orderValue ?? 0), 0)
  const totalCollected = visits.reduce((s, v) => s + (v.collected ?? 0), 0)

  const columns: Column<any>[] = [
    {
      key: 'customer', header: 'Customer', sortable: true, sortAccessor: (v) => v.customer?.businessName ?? '',
      cell: (v) => <span className="text-sm font-medium">{v.customer?.businessName ?? '—'}</span>,
    },
    {
      key: 'salesman', header: 'Salesman',
      cell: (v) => <span className="text-xs">{v.salesman?.name ?? '—'}</span>,
    },
    {
      key: 'type', header: 'Type', align: 'center',
      cell: (v) => <Badge variant="outline" className="capitalize">{v.type.replace('_', ' ')}</Badge>,
    },
    {
      key: 'scheduledAt', header: 'Scheduled', sortable: true,
      cell: (v) => <span className="text-xs text-muted-foreground">{fmtDateTime(v.scheduledAt)}</span>,
    },
    {
      key: 'orderValue', header: 'Order Value', align: 'right', sortable: true,
      cell: (v) => <span className="tabular-nums text-sm">{v.orderValue ? fmtINR(v.orderValue, true) : '—'}</span>,
    },
    {
      key: 'collected', header: 'Collected', align: 'right', sortable: true,
      cell: (v) => <span className="tabular-nums text-sm text-emerald-600">{v.collected ? fmtINR(v.collected, true) : '—'}</span>,
    },
    {
      key: 'status', header: 'Status', align: 'center',
      cell: (v) => <StatusBadge status={v.status} />,
    },
    {
      key: 'notes', header: 'Notes',
      cell: (v) => <span className="text-xs text-muted-foreground truncate max-w-[200px] block">{v.notes ?? '—'}</span>,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visits & Field Activity"
        description={`${visits.length} visits · ${completed.length} completed · ${planned.length} planned`}
        icon={MapPin}
        accent="info"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => exportCSV('visits.csv', visits)}>
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportXLSX('visits.xlsx', visits, 'Visits')}>
              <Download className="h-4 w-4" /> Excel
            </Button>
            <Button size="sm" onClick={() => toast({ title: 'Coming soon', description: 'Visit logging form' })}>
              <Plus className="h-4 w-4" /> Log Visit
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Total Visits" value={String(visits.length)} icon={MapPin} accent="info" sublabel={`${completed.length} completed`} />
        <KPICard label="Planned" value={String(planned.length)} icon={Clock} accent="warning" sublabel="Upcoming visits" />
        <KPICard label="Order Value" value={fmtINR(totalOrderValue, true)} icon={TrendingUp} accent="success" sublabel="From visits" />
        <KPICard label="Collected" value={fmtINR(totalCollected, true)} icon={IndianRupee} accent="primary" sublabel="During visits" />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({visits.length})</TabsTrigger>
          <TabsTrigger value="planned">Planned ({planned.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
          <TabsTrigger value="missed">Missed ({missed.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <DataTable data={visits} columns={columns} loading={loading} pageSize={12} searchPlaceholder="Search visits..." />
        </TabsContent>
        <TabsContent value="planned" className="mt-4">
          <DataTable data={planned} columns={columns} loading={loading} pageSize={12} searchPlaceholder="Search planned..." />
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          <DataTable data={completed} columns={columns} loading={loading} pageSize={12} searchPlaceholder="Search completed..." />
        </TabsContent>
        <TabsContent value="missed" className="mt-4">
          <DataTable data={missed} columns={columns} loading={loading} pageSize={12} searchPlaceholder="Search missed..." />
        </TabsContent>
      </Tabs>
    </div>
  )
}
