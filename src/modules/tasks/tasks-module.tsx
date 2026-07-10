'use client'
import { useState } from 'react'
import { PageHeader } from '@/shared/components/page-header'
import { DataTable, type Column } from '@/shared/components/data-table'
import { KPICard } from '@/shared/components/kpi-card'
import { StatusBadge, Badge } from '@/shared/components/status-badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { CheckSquare, Clock, AlertCircle, Plus, Download, Calendar } from 'lucide-react'
import { fmtDate, exportCSV, exportXLSX } from '@/shared/lib/format'
import { useToast } from '@/hooks/use-toast'

export function TasksModule() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useState(() => {
    fetch('/api/tasks')
      .then((r) => r.json())
      .then((t) => setTasks(t))
      .catch(() => {})
      .finally(() => setLoading(false))
  })

  const open = tasks.filter((t) => t.status === 'open')
  const inProgress = tasks.filter((t) => t.status === 'in_progress')
  const done = tasks.filter((t) => t.status === 'done')
  const overdue = tasks.filter((t) => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < new Date())

  const priorityVariant: Record<string, any> = {
    urgent: 'danger', high: 'warning', medium: 'info', low: 'default',
  }

  const columns: Column<any>[] = [
    {
      key: 'title', header: 'Task', sortable: true,
      cell: (t) => (
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{t.title}</p>
          {t.description && <p className="text-xs text-muted-foreground truncate">{t.description}</p>}
        </div>
      ),
    },
    {
      key: 'assignee', header: 'Assignee',
      cell: (t) => <span className="text-xs">{t.assignee?.name ?? 'Unassigned'}</span>,
    },
    {
      key: 'customer', header: 'Customer',
      cell: (t) => <span className="text-xs">{t.customer?.businessName ?? '—'}</span>,
    },
    {
      key: 'type', header: 'Type', align: 'center',
      cell: (t) => <Badge variant="outline" className="capitalize">{t.type}</Badge>,
    },
    {
      key: 'priority', header: 'Priority', align: 'center', sortable: true,
      cell: (t) => <Badge variant={priorityVariant[t.priority] ?? 'default'} className="capitalize">{t.priority}</Badge>,
    },
    {
      key: 'dueDate', header: 'Due Date', sortable: true,
      cell: (t) => {
        if (!t.dueDate) return <span className="text-xs text-muted-foreground">—</span>
        const isOverdue = new Date(t.dueDate) < new Date() && t.status !== 'done'
        return <span className={`text-xs ${isOverdue ? 'text-rose-600 font-medium' : 'text-muted-foreground'}`}>{fmtDate(t.dueDate)}{isOverdue ? ' · Overdue' : ''}</span>
      },
    },
    {
      key: 'status', header: 'Status', align: 'center',
      cell: (t) => <StatusBadge status={t.status === 'in_progress' ? 'dispatched' : t.status === 'done' ? 'delivered' : 'pending'} />,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks & Follow-ups"
        description={`${tasks.length} tasks · ${open.length} open · ${overdue.length} overdue`}
        icon={CheckSquare}
        accent="violet"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => exportCSV('tasks.csv', tasks)}>
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportXLSX('tasks.xlsx', tasks, 'Tasks')}>
              <Download className="h-4 w-4" /> Excel
            </Button>
            <Button size="sm" onClick={() => toast({ title: 'Coming soon', description: 'Task creation form' })}>
              <Plus className="h-4 w-4" /> New Task
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Total Tasks" value={String(tasks.length)} icon={CheckSquare} accent="info" sublabel={`${open.length} open`} />
        <KPICard label="In Progress" value={String(inProgress.length)} icon={Clock} accent="warning" sublabel="Active tasks" />
        <KPICard label="Completed" value={String(done.length)} icon={CheckSquare} accent="success" sublabel="Done tasks" />
        <KPICard label="Overdue" value={String(overdue.length)} icon={AlertCircle} accent="danger" sublabel="Past due date" />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({tasks.length})</TabsTrigger>
          <TabsTrigger value="open">Open ({open.length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({inProgress.length})</TabsTrigger>
          <TabsTrigger value="done">Done ({done.length})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({overdue.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <DataTable data={tasks} columns={columns} loading={loading} pageSize={12} searchPlaceholder="Search tasks..." />
        </TabsContent>
        <TabsContent value="open" className="mt-4">
          <DataTable data={open} columns={columns} loading={loading} pageSize={12} searchPlaceholder="Search open..." />
        </TabsContent>
        <TabsContent value="in_progress" className="mt-4">
          <DataTable data={inProgress} columns={columns} loading={loading} pageSize={12} searchPlaceholder="Search in progress..." />
        </TabsContent>
        <TabsContent value="done" className="mt-4">
          <DataTable data={done} columns={columns} loading={loading} pageSize={12} searchPlaceholder="Search done..." />
        </TabsContent>
        <TabsContent value="overdue" className="mt-4">
          <DataTable data={overdue} columns={columns} loading={loading} pageSize={12} searchPlaceholder="Search overdue..." />
        </TabsContent>
      </Tabs>
    </div>
  )
}
