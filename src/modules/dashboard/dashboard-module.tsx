'use client'
import { useState } from 'react'
import { KPICard } from '@/shared/components/kpi-card'
import { PageHeader } from '@/shared/components/page-header'
import { CardSkeleton, ChartSkeleton } from '@/shared/components/loading-states'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/shared/components/status-badge'
import { AreaChartCard, BarChartCard, DonutChart, HorizontalBarChart, LineChartCard, ComposedChartCard, HeatmapGrid, RadialProgress } from '@/shared/components/charts'
import {
  LayoutDashboard, IndianRupee, TrendingUp, Wallet, AlertTriangle, Package,
  ShoppingCart, Users, Target, Trophy, Activity, Zap, ArrowRight, Sparkles,
  AlertCircle, CheckCircle2, Info, TrendingDown, Calendar, Download, RefreshCw,
} from 'lucide-react'
import { fmtINR, fmtINR2, fmtNumber, fmtRelative, fmtPercent, exportCSV } from '@/shared/lib/format'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useDashboard, useInsights, useGenerateInsights } from '@/shared/services/mutations'

export function DashboardModule() {
  const { data, isLoading: loading } = useDashboard()
  const { data: insights = [], refetch } = useInsights()
  const genInsights = useGenerateInsights()
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d')

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Executive Dashboard" description="Real-time KPIs and business performance" icon={LayoutDashboard} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartSkeleton /><ChartSkeleton />
        </div>
      </div>
    )
  }

  const k = data.kpis

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Dashboard"
        description={`Real-time business performance · Updated ${fmtRelative(new Date())}`}
        icon={LayoutDashboard}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border p-0.5">
              {(['7d', '30d', '90d'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cn('px-2.5 py-1 text-xs font-medium rounded-md transition-colors', range === r ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
                >
                  {r}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => exportCSV('dashboard-kpis.csv', [k as any])}>
              <Download className="h-4 w-4" /> Export
            </Button>
          </div>
        }
      />

      {/* KPI ROW 1 — Money */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Today's Sales" value={fmtINR(k.todaySales)} delta={12.4} deltaLabel="vs yesterday" icon={IndianRupee} accent="primary" sublabel={`${fmtNumber(k.pendingOrders)} pending orders`} sparkline={data.revenueTrend.slice(-7).map((d) => d.revenue ?? 0)} />
        <KPICard label="Weekly Sales" value={fmtINR(k.weeklySales, true)} delta={8.1} deltaLabel="vs last week" icon={TrendingUp} accent="success" sublabel="On track for target" sparkline={data.revenueTrend.slice(-7).map((d) => d.revenue ?? 0)} />
        <KPICard label="Monthly Sales" value={fmtINR(k.monthlySales, true)} delta={15.2} deltaLabel="vs last month" icon={Calendar} accent="info" sublabel={`${fmtNumber(k.completedOrders)} orders delivered`} sparkline={data.revenueTrend.map((d) => d.revenue ?? 0)} />
        <KPICard label="Gross Profit" value={fmtINR(k.grossProfit, true)} delta={6.8} deltaLabel="margin" icon={Trophy} accent="violet" sublabel={`${((k.grossProfit / k.monthlySales) * 100).toFixed(1)}% margin`} sparkline={data.profitTrend.slice(-14).map((d) => d.profit ?? 0)} />
      </div>

      {/* KPI ROW 2 — Cash & Risk */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Cash Available" value={fmtINR(k.cashAvailable, true)} icon={Wallet} accent="success" sublabel="3 bank accounts" />
        <KPICard label="Outstanding" value={fmtINR(k.outstandingPayments, true)} icon={AlertCircle} accent="warning" sublabel={`${k.totalCustomers} customers`} delta={-4.2} deltaLabel="vs last week" />
        <KPICard label="Inventory Value" value={fmtINR(k.inventoryValue, true)} icon={Package} accent="info" sublabel={`${k.lowStockCount} low stock alerts`} />
        <KPICard label="Net Profit" value={fmtINR(k.netProfit, true)} delta={9.3} deltaLabel="this month" icon={TrendingUp} accent="primary" sublabel={`After ${fmtINR(k.grossProfit - k.netProfit, true)} expenses`} />
      </div>

      {/* AI Insight banner */}
      <AIInsightBanner insights={insights} onRegenerate={() => genInsights.mutate()} regenerating={genInsights.isPending} />

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold">Revenue & Profit Trend</h3>
              <p className="text-xs text-muted-foreground">Last 30 days · Daily</p>
            </div>
            <Badge variant="success"><TrendingUp className="h-3 w-3" /> +15.2% MoM</Badge>
          </div>
          <AreaChartCard
            data={data.revenueTrend}
            xKey="date"
            yKeys={[{ key: 'revenue', label: 'Revenue', color: 'var(--chart-1)' }]}
            height={240}
            formatter={(v) => fmtINR(v, true)}
          />
        </Card>
        <Card className="p-5 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold">Order Status</h3>
              <p className="text-xs text-muted-foreground">Current pipeline</p>
            </div>
          </div>
          <DonutChart
            data={data.orderStatus.map((d) => ({ label: d.label, value: d.value }))}
            height={220}
            formatter={(v) => `${v}`}
            centerLabel="Orders"
            centerValue={fmtNumber(data.orderStatus.reduce((s, d) => s + d.value, 0))}
          />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold">Cash Flow</h3>
              <p className="text-xs text-muted-foreground">Inflows vs outflows · last 30 days</p>
            </div>
          </div>
          <ComposedChartCard
            data={data.cashFlowTrend}
            xKey="date"
            yKeys={[
              { key: 'cashIn', label: 'Inflow', type: 'bar', color: 'var(--chart-2)' },
              { key: 'cashOut', label: 'Outflow', type: 'bar', color: 'var(--chart-5)' },
            ]}
            height={220}
            formatter={(v) => fmtINR(v, true)}
          />
        </Card>
        <Card className="p-5 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold">Profit vs COGS</h3>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </div>
          </div>
          <ComposedChartCard
            data={data.profitTrend}
            xKey="date"
            yKeys={[
              { key: 'cogs', label: 'COGS', type: 'bar', color: 'var(--chart-5)' },
              { key: 'profit', label: 'Profit', type: 'line', color: 'var(--chart-2)' },
            ]}
            height={220}
            formatter={(v) => fmtINR(v, true)}
          />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 shadow-soft">
          <h3 className="text-sm font-semibold mb-1">Top Products</h3>
          <p className="text-xs text-muted-foreground mb-3">By revenue · this month</p>
          <HorizontalBarChart
            data={data.topProducts.slice(0, 6)}
            xKey="label"
            yKeys={[{ key: 'value', color: 'var(--chart-1)' }]}
            height={200}
            formatter={(v) => fmtINR(v, true)}
          />
        </Card>
        <Card className="p-5 shadow-soft">
          <h3 className="text-sm font-semibold mb-1">Top Customers</h3>
          <p className="text-xs text-muted-foreground mb-3">By revenue · this month</p>
          <HorizontalBarChart
            data={data.topCustomers.slice(0, 6)}
            xKey="label"
            yKeys={[{ key: 'value', color: 'var(--chart-3)' }]}
            height={200}
            formatter={(v) => fmtINR(v, true)}
          />
        </Card>
        <Card className="p-5 shadow-soft">
          <h3 className="text-sm font-semibold mb-1">Top Salesmen</h3>
          <p className="text-xs text-muted-foreground mb-3">By revenue · this month</p>
          <HorizontalBarChart
            data={data.topSalesmen.slice(0, 6)}
            xKey="label"
            yKeys={[{ key: 'value', color: 'var(--chart-2)' }]}
            height={200}
            formatter={(v) => fmtINR(v, true)}
          />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 shadow-soft">
          <h3 className="text-sm font-semibold mb-1">Sales by District</h3>
          <p className="text-xs text-muted-foreground mb-3">Revenue heatmap</p>
          <HeatmapGrid data={data.salesByDistrict.slice(0, 6)} formatter={(v) => fmtINR(v, true)} />
        </Card>
        <Card className="p-5 shadow-soft">
          <h3 className="text-sm font-semibold mb-1">Sales by Area</h3>
          <p className="text-xs text-muted-foreground mb-3">Zone-wise distribution</p>
          <HeatmapGrid data={data.salesByArea.slice(0, 6)} formatter={(v) => fmtINR(v, true)} />
        </Card>
        <Card className="p-5 shadow-soft">
          <h3 className="text-sm font-semibold mb-1">Target Achievement</h3>
          <p className="text-xs text-muted-foreground mb-3">Monthly sales team target</p>
          <div className="flex items-center justify-around py-2">
            <RadialProgress value={k.targetAchievement} label="Achieved" color="var(--chart-2)" size={140} />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="rounded-lg bg-muted/40 p-2.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Daily Collection</p>
              <p className="text-base font-semibold tabular-nums mt-0.5">{fmtINR(k.dailyCollection, true)}</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-2.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Top Performer</p>
              <p className="text-base font-semibold mt-0.5 truncate">{k.topSalesman?.name ?? '—'}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Trends */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5 shadow-soft">
          <h3 className="text-sm font-semibold mb-1">Fast-Moving SKUs</h3>
          <p className="text-xs text-muted-foreground mb-3">Top by quantity sold</p>
          <BarChartCard
            data={data.fastMoving}
            xKey="label"
            yKeys={[{ key: 'value', label: 'Units sold', color: 'var(--chart-2)' }]}
            height={200}
            formatter={(v) => `${v}`}
          />
        </Card>
        <Card className="p-5 shadow-soft">
          <h3 className="text-sm font-semibold mb-1">Slow-Moving SKUs</h3>
          <p className="text-xs text-muted-foreground mb-3">Bottom by quantity sold</p>
          <BarChartCard
            data={data.slowMoving}
            xKey="label"
            yKeys={[{ key: 'value', label: 'Units sold', color: 'var(--chart-5)' }]}
            height={200}
            formatter={(v) => `${v}`}
          />
        </Card>
      </div>

      {/* Alerts row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AlertCard icon={Package} accent="warning" title="Low Stock" value={k.lowStockCount} sub="SKUs need reordering" cta="View Inventory" />
        <AlertCard icon={AlertTriangle} accent="danger" title="Expiry Alerts" value={k.expiryAlertCount} sub="Batches expiring <30 days" cta="View Batches" />
        <AlertCard icon={ShoppingCart} accent="info" title="Pending Orders" value={k.pendingOrders} sub="Awaiting processing" cta="View Orders" />
        <AlertCard icon={CheckCircle2} accent="success" title="Delivered" value={k.completedOrders} sub="Orders completed" cta="View Sales" />
      </div>
    </div>
  )
}

function AIInsightBanner({ insights, onRegenerate, regenerating }: { insights: any[]; onRegenerate?: () => void; regenerating?: boolean }) {
  const [idx, setIdx] = useState(0)
  if (!insights.length) return null
  const top = insights[idx % insights.length]
  const sevConfig = {
    critical: { bg: 'bg-rose-500/5', border: 'border-rose-500/20', icon: AlertCircle, iconColor: 'text-rose-500' },
    warning: { bg: 'bg-amber-500/5', border: 'border-amber-500/20', icon: AlertTriangle, iconColor: 'text-amber-500' },
    success: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', icon: CheckCircle2, iconColor: 'text-emerald-500' },
    info: { bg: 'bg-sky-500/5', border: 'border-sky-500/20', icon: Info, iconColor: 'text-sky-500' },
  }
  const s = sevConfig[top.severity]
  return (
    <motion.div
      key={top.id}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('relative rounded-xl border p-4 flex items-start gap-3', s.bg, s.border)}
    >
      <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg shrink-0', s.bg, s.iconColor)}>
        <s.icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold">{top.title}</p>
          <Badge variant={top.severity === 'critical' ? 'danger' : top.severity === 'warning' ? 'warning' : top.severity === 'success' ? 'success' : 'info'}>
            {top.category}
          </Badge>
          <Badge variant="outline"><Sparkles className="h-3 w-3" /> AI Insight</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{top.body}</p>
        {top.recommendation && (
          <div className="mt-2 flex items-start gap-2 rounded-lg bg-card/60 p-2 border border-border/50">
            <Zap className="h-3 w-3 text-primary shrink-0 mt-0.5" />
            <p className="text-xs">{top.recommendation}</p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {onRegenerate && (
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onRegenerate} disabled={regenerating}>
            <RefreshCw className={`h-3 w-3 ${regenerating ? 'animate-spin' : ''}`} /> {regenerating ? 'Generating...' : 'Regenerate'}
          </Button>
        )}
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIdx((i) => i + 1)}>
          Next <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </motion.div>
  )
}

function AlertCard({ icon: Icon, accent, title, value, sub, cta }: {
  icon: any; accent: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'violet'
  title: string; value: number; sub: string; cta: string
}) {
  const a = {
    primary: 'bg-orange-500/10 text-orange-600',
    success: 'bg-emerald-500/10 text-emerald-600',
    warning: 'bg-amber-500/10 text-amber-600',
    danger: 'bg-rose-500/10 text-rose-600',
    info: 'bg-sky-500/10 text-sky-600',
    violet: 'bg-violet-500/10 text-violet-600',
  }
  return (
    <Card className="p-4 shadow-soft hover:shadow-soft-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', a[accent])}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-xs text-muted-foreground">{cta}</span>
      </div>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs font-medium mt-0.5">{title}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </Card>
  )
}
