'use client'
import { useState } from 'react'
import { PageHeader } from '@/shared/components/page-header'
import { DataTable, type Column } from '@/shared/components/data-table'
import { KPICard } from '@/shared/components/kpi-card'
import { StatusBadge, Badge } from '@/shared/components/status-badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { EmptyState, CardSkeleton } from '@/shared/components/loading-states'
import {
  Users, Phone, MapPin, IndianRupee, Star, TrendingUp, AlertTriangle, UserPlus,
  Download, Filter, MessageSquare, PhoneCall, MapPin as Visit, Clock, ChevronLeft,
  CreditCard, ShoppingCart, FileText, StickyNote, Mail, Plus, Trash2,
} from 'lucide-react'
import { fmtINR, fmtRelative, fmtDate, exportCSV, riskColor, cn } from '@/shared/lib/format'
import { useApp } from '@/shared/lib/store'
import { motion } from 'framer-motion'
import {
  useCustomers, useCustomer, useCustomerTimeline, useCustomerOrders,
  useDeleteCustomer, useAddTimelineEntry,
} from '@/shared/services/mutations'
import { CustomerFormDrawer } from './customer-form-drawer'
import { TimelineEntryDrawer } from './timeline-entry-drawer'
import { PaymentDrawer } from '@/modules/finance/payment-drawer'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import type { Customer, TimelineEntry, SalesOrder } from '@/shared/types'

export function CRMModule() {
  const { activeCustomerId, setActiveCustomer } = useApp()
  if (activeCustomerId) return <CustomerDetail customerId={activeCustomerId} onBack={() => setActiveCustomer(null)} />
  return <CustomerList />
}

function CustomerList() {
  const { data: customers = [], isLoading: loading } = useCustomers()
  const [filter, setFilter] = useState<string>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [paymentFor, setPaymentFor] = useState<string | null>(null)
  const deleteCustomer = useDeleteCustomer()
  const { setActiveCustomer } = useApp()

  const filtered = filter === 'all' ? customers : customers.filter((c) => c.status === filter)
  const totalOutstanding = customers.reduce((s, c) => s + c.outstanding, 0)
  const activeCount = customers.filter((c) => c.status === 'active').length
  const avgLTV = customers.length ? customers.reduce((s, c) => s + c.lifetimeValue, 0) / customers.length : 0
  const leadCount = customers.filter((c) => c.status === 'lead').length

  const columns: Column<Customer>[] = [
    {
      key: 'businessName', header: 'Customer', sortable: true,
      cell: (c) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-500 text-white text-xs">
              {c.businessName.split(' ').slice(0, 2).map((n) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{c.businessName}</p>
            <p className="text-xs text-muted-foreground truncate">{c.ownerName ?? '—'} · {c.phone}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'area', header: 'Location', sortable: true, sortAccessor: (c) => c.area,
      cell: (c) => <div><p className="text-sm">{c.area}</p><p className="text-xs text-muted-foreground">{c.district}</p></div>,
    },
    {
      key: 'status', header: 'Status',
      cell: (c) => <StatusBadge status={c.status} />,
    },
    {
      key: 'outstanding', header: 'Outstanding', align: 'right', sortable: true, sortAccessor: (c) => c.outstanding,
      cell: (c) => <span className={cn('tabular-nums text-sm font-medium', c.outstanding > 0 ? 'text-rose-600 dark:text-rose-400' : '')}>{fmtINR(c.outstanding, true)}</span>,
    },
    {
      key: 'creditLimit', header: 'Credit', align: 'right', sortable: true, sortAccessor: (c) => c.creditLimit,
      cell: (c) => <div><p className="text-sm tabular-nums">{fmtINR(c.creditLimit, true)}</p><p className="text-[10px] text-muted-foreground">{c.creditDays}d terms</p></div>,
    },
    {
      key: 'lifetimeValue', header: 'LTV', align: 'right', sortable: true, sortAccessor: (c) => c.lifetimeValue,
      cell: (c) => <span className="tabular-nums text-sm">{fmtINR(c.lifetimeValue, true)}</span>,
    },
    {
      key: 'riskScore', header: 'Risk', align: 'center', sortable: true, sortAccessor: (c) => c.riskScore,
      cell: (c) => (
        <div className="flex flex-col items-center">
          <span className={cn('text-sm font-semibold tabular-nums', riskColor(c.riskScore))}>{c.riskScore.toFixed(0)}</span>
          <div className="h-1 w-12 rounded-full bg-muted overflow-hidden mt-1">
            <div className={cn('h-full', c.riskScore >= 70 ? 'bg-rose-500' : c.riskScore >= 40 ? 'bg-amber-500' : 'bg-emerald-500')} style={{ width: `${c.riskScore}%` }} />
          </div>
        </div>
      ),
    },
    {
      key: 'lastOrderAt', header: 'Last Order', align: 'right', sortable: true, sortAccessor: (c) => c.lastOrderAt ?? '',
      cell: (c) => <span className="text-xs text-muted-foreground">{fmtRelative(c.lastOrderAt)}</span>,
    },
    {
      key: 'actions', header: '', align: 'right',
      cell: (c) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setPaymentFor(c.id)}>
            <IndianRupee className="h-3 w-3" /> Payment
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">⋯</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setEditing(c); setFormOpen(true) }}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(`/api/customers/${c.id}/statement`, '_blank')}>Print Statement</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setPaymentFor(c.id) }}>Record Payment</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-rose-600" onClick={() => { if (confirm(`Delete ${c.businessName}?`)) deleteCustomer.mutate(c.id) }}>
                <Trash2 className="h-3 w-3" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM — Retailers & Distributors"
        description={`${customers.length} customers · ${activeCount} active · ${leadCount} leads`}
        icon={Users}
        accent="info"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => exportCSV('customers.csv', customers as any)}>
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true) }}><UserPlus className="h-4 w-4" /> Add Customer</Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Total Customers" value={fmtINR(customers.length, true).replace('₹', '')} icon={Users} accent="info" sublabel={`${activeCount} active · ${leadCount} leads`} />
        <KPICard label="Outstanding" value={fmtINR(totalOutstanding, true)} icon={AlertTriangle} accent="warning" sublabel="Receivables" delta={-4.2} deltaLabel="vs last week" />
        <KPICard label="Avg LTV" value={fmtINR(avgLTV, true)} icon={Star} accent="violet" sublabel="Customer lifetime value" />
        <KPICard label="Credit Limit" value={fmtINR(customers.reduce((s, c) => s + c.creditLimit, 0), true)} icon={CreditCard} accent="success" sublabel="Total extended" />
      </div>

      <Tabs defaultValue="all" value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All ({customers.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({customers.filter((c) => c.status === 'active').length})</TabsTrigger>
          <TabsTrigger value="lead">Leads ({customers.filter((c) => c.status === 'lead').length})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({customers.filter((c) => c.status === 'inactive').length})</TabsTrigger>
          <TabsTrigger value="blocked">Blocked ({customers.filter((c) => c.status === 'blocked').length})</TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable
        data={filtered}
        columns={columns}
        loading={loading}
        onRowClick={(c) => setActiveCustomer(c.id)}
        pageSize={12}
        searchPlaceholder="Search by name, phone, area..."
      />

      <CustomerFormDrawer open={formOpen} onOpenChange={setFormOpen} editing={editing} />
      <PaymentDrawer open={!!paymentFor} onOpenChange={(b) => !b && setPaymentFor(null)} presetCustomerId={paymentFor ?? undefined} />
    </div>
  )
}

function CustomerDetail({ customerId, onBack }: { customerId: string; onBack: () => void }) {
  const { data: customer, isLoading: loadingCustomer } = useCustomer(customerId)
  const { data: timeline = [], isLoading: loadingTimeline } = useCustomerTimeline(customerId)
  const { data: orders = [], isLoading: loadingOrders } = useCustomerOrders(customerId)
  const [timelineOpen, setTimelineOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const loading = loadingCustomer || loadingTimeline || loadingOrders

  if (loading || !customer) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack}><ChevronLeft className="h-4 w-4" /> Back</Button>
        <div className="grid gap-4 lg:grid-cols-3">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      </div>
    )
  }

  const creditUtilization = customer.creditLimit > 0 ? (customer.outstanding / customer.creditLimit) * 100 : 0
  const timelineIcons: Record<string, any> = {
    note: StickyNote, call: PhoneCall, visit: Visit, whatsapp: MessageSquare,
    invoice: FileText, payment: CreditCard, order: ShoppingCart, email: Mail,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}><ChevronLeft className="h-4 w-4" /> Back to Customers</Button>
      </div>

      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-500 text-white text-xl">
            {customer.businessName.split(' ').slice(0, 2).map((n) => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight">{customer.businessName}</h1>
            <StatusBadge status={customer.status} />
            <Badge variant="outline">{customer.type}</Badge>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {customer.phone}</span>
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {customer.area}, {customer.district}</span>
            {customer.ownerName && <span>Owner: {customer.ownerName}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open(`tel:${customer.phone}`)}><PhoneCall className="h-4 w-4" /> Call</Button>
          <Button variant="outline" size="sm" onClick={() => window.open(`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}`)}><MessageSquare className="h-4 w-4" /> WhatsApp</Button>
          <Button variant="outline" size="sm" onClick={() => window.open(`/api/customers/${customer.id}/statement`, '_blank')}><FileText className="h-4 w-4" /> Statement</Button>
          <Button size="sm" onClick={() => setPaymentOpen(true)}><IndianRupee className="h-4 w-4" /> Record Payment</Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Outstanding" value={fmtINR(customer.outstanding, true)} icon={AlertTriangle} accent={customer.outstanding > 0 ? 'warning' : 'success'} sublabel={`Credit limit ${fmtINR(customer.creditLimit, true)}`} />
        <KPICard label="Lifetime Value" value={fmtINR(customer.lifetimeValue, true)} icon={Star} accent="violet" sublabel={`Profit: ${fmtINR(customer.profitGenerated, true)}`} />
        <KPICard label="Avg Order" value={fmtINR(customer.avgOrderValue, true)} icon={TrendingUp} accent="info" sublabel={`${customer.orderFrequency.toFixed(1)} orders/month`} />
        <KPICard label="Risk Score" value={customer.riskScore.toFixed(0)} icon={AlertTriangle} accent={customer.riskScore >= 70 ? 'danger' : customer.riskScore >= 40 ? 'warning' : 'success'} sublabel={`Retention ${customer.retentionScore.toFixed(0)}/100`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left column — Profile & Credit */}
        <div className="space-y-4">
          <Card className="p-5 shadow-soft">
            <h3 className="text-sm font-semibold mb-3">Business Details</h3>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Owner</dt><dd>{customer.ownerName ?? '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">GST</dt><dd className="font-mono text-xs">{customer.gst ?? '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">FSSAI</dt><dd className="font-mono text-xs">{customer.fssai ?? '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Salesman</dt><dd>{customer.salesman?.name ?? '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">PIN</dt><dd>{customer.pin ?? '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Last Order</dt><dd>{fmtRelative(customer.lastOrderAt)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Last Payment</dt><dd>{fmtRelative(customer.lastPaymentAt)}</dd></div>
            </dl>
          </Card>

          <Card className="p-5 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Credit Utilization</h3>
              <Badge variant={creditUtilization > 80 ? 'danger' : creditUtilization > 60 ? 'warning' : 'success'}>
                {creditUtilization.toFixed(0)}%
              </Badge>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className={cn('h-full transition-all', creditUtilization > 80 ? 'bg-rose-500' : creditUtilization > 60 ? 'bg-amber-500' : 'bg-emerald-500')} style={{ width: `${creditUtilization}%` }} />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{fmtINR(customer.outstanding, true)} used</span>
              <span>{fmtINR(customer.creditLimit - customer.outstanding, true)} available</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4 text-center">
              <div className="rounded-lg bg-muted/40 p-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Credit Days</p>
                <p className="text-sm font-semibold">{customer.creditDays}d</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Retention</p>
                <p className="text-sm font-semibold">{customer.retentionScore.toFixed(0)}/100</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Middle + Right — Timeline + Orders */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Timeline</h3>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setTimelineOpen(true)}>
                <Plus className="h-3 w-3" /> Add Entry
              </Button>
            </div>
            {timeline.length === 0 ? (
              <EmptyState title="No timeline entries" icon={Clock} description="Notes, calls, and visits will appear here" />
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {timeline.map((t) => {
                  const Icon = timelineIcons[t.type] ?? StickyNote
                  return (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-3"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted shrink-0">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0 pb-3 border-b last:border-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">{t.title}</p>
                          <span className="text-[10px] text-muted-foreground shrink-0">{fmtRelative(t.createdAt)}</span>
                        </div>
                        {t.body && <p className="text-xs text-muted-foreground mt-0.5">{t.body}</p>}
                        <Badge variant="outline" className="mt-1.5 capitalize">{t.type}</Badge>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </Card>

          <Card className="p-5 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Recent Orders</h3>
              <span className="text-xs text-muted-foreground">{orders.length} orders</span>
            </div>
            {orders.length === 0 ? (
              <EmptyState title="No orders yet" icon={ShoppingCart} />
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                {orders.slice(0, 10).map((o) => (
                  <div key={o.id} className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-muted/40 transition-colors">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium font-mono">{o.orderNo}</p>
                        <StatusBadge status={o.status} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{fmtDate(o.createdAt)} · {o.itemsCount} items</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold tabular-nums">{fmtINR(o.total, true)}</p>
                      <StatusBadge status={o.paymentStatus} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <TimelineEntryDrawer open={timelineOpen} onOpenChange={setTimelineOpen} customerId={customer.id} />
      <PaymentDrawer open={paymentOpen} onOpenChange={setPaymentOpen} presetCustomerId={customer.id} />
    </div>
  )
}
