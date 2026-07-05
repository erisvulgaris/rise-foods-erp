'use client'
import { PageHeader } from '@/shared/components/page-header'
import { KPICard } from '@/shared/components/kpi-card'
import { Card } from '@/components/ui/card'
import { Badge } from '@/shared/components/status-badge'
import { BarChart3, TrendingUp, MapPin, Trophy, Activity, Calendar, Target, Zap, DollarSign, Gauge } from 'lucide-react'
import { fmtINR, fmtNumber, cn } from '@/shared/lib/format'
import { AreaChartCard, BarChartCard, HorizontalBarChart, DonutChart, HeatmapGrid, RadarChartCard, RadialProgress, LineChartCard, ComposedChartCard } from '@/shared/components/charts'
import { ChartSkeleton } from '@/shared/components/loading-states'
import { useAnalytics } from '@/shared/services/mutations'

export function AnalyticsModule() {
  const { data, isLoading: loading } = useAnalytics()

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" description="AI dashboards · rankings · forecasts" icon={BarChart3} accent="violet" />
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartSkeleton /><ChartSkeleton /><ChartSkeleton /><ChartSkeleton />
        </div>
      </div>
    )
  }

  const ccc = data.cashConversionCycle

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & AI Insights"
        description="Heatmaps, rankings, ABC/XYZ analysis, demand forecast, cash conversion cycle"
        icon={BarChart3}
        accent="violet"
        actions={<Badge variant="violet"><Zap className="h-3 w-3" /> AI-Powered</Badge>}
      />

      {/* Top KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Cash Conversion" value={`${ccc.days.toFixed(0)}d`} icon={Gauge} accent={ccc.days > 30 ? 'warning' : 'success'} sublabel={`Inv ${ccc.inventoryDays}d + Rec ${ccc.receivableDays}d - Pay ${ccc.payableDays}d`} />
        <KPICard label="Forecast Next 14d" value={fmtINR(data.forecast.reduce((s, d) => s + d.value, 0), true)} icon={TrendingUp} accent="info" sublabel="Based on 30d trend + 15% growth" delta={15} deltaLabel="uplift" />
        <KPICard label="Avg Retailer LTV" value={fmtINR(data.retailerRanking.length ? data.retailerRanking.reduce((s, r) => s + r.value, 0) / data.retailerRanking.length : 0, true)} icon={Trophy} accent="primary" sublabel={`${data.retailerRanking.length} ranked retailers`} />
        <KPICard label="Top SKU" value={data.skuRanking[0]?.label ?? '—'} icon={TrendingUp} accent="success" sublabel={fmtINR(data.skuRanking[0]?.value ?? 0, true) + ' revenue'} />
      </div>

      {/* Heatmaps */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5 shadow-soft">
          <h3 className="text-sm font-semibold mb-1">Revenue Heatmap — Districts</h3>
          <p className="text-xs text-muted-foreground mb-3">Geographic concentration</p>
          <HeatmapGrid data={data.districtHeatmap} formatter={(v) => fmtINR(v, true)} />
        </Card>
        <Card className="p-5 shadow-soft">
          <h3 className="text-sm font-semibold mb-1">Revenue Heatmap — Areas</h3>
          <p className="text-xs text-muted-foreground mb-3">Zone performance</p>
          <HeatmapGrid data={data.areaHeatmap} formatter={(v) => fmtINR(v, true)} />
        </Card>
      </div>

      {/* Rankings */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5 shadow-soft">
          <h3 className="text-sm font-semibold mb-1">Retailer Ranking</h3>
          <p className="text-xs text-muted-foreground mb-3">Top 10 by revenue</p>
          <HorizontalBarChart data={data.retailerRanking.slice(0, 10)} xKey="label" yKeys={[{ key: 'value', color: 'var(--chart-1)' }]} height={260} formatter={(v) => fmtINR(v, true)} />
        </Card>
        <Card className="p-5 shadow-soft">
          <h3 className="text-sm font-semibold mb-1">SKU Ranking</h3>
          <p className="text-xs text-muted-foreground mb-3">Top 10 by revenue</p>
          <HorizontalBarChart data={data.skuRanking.slice(0, 10)} xKey="label" yKeys={[{ key: 'value', color: 'var(--chart-3)' }]} height={260} formatter={(v) => fmtINR(v, true)} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5 shadow-soft">
          <h3 className="text-sm font-semibold mb-1">Salesman Ranking</h3>
          <p className="text-xs text-muted-foreground mb-3">Revenue & order count</p>
          <HorizontalBarChart data={data.salesmanRanking} xKey="label" yKeys={[{ key: 'value', color: 'var(--chart-2)' }]} height={200} formatter={(v) => fmtINR(v, true)} />
        </Card>
        <Card className="p-5 shadow-soft">
          <h3 className="text-sm font-semibold mb-1">Supplier Ranking</h3>
          <p className="text-xs text-muted-foreground mb-3">By total purchased</p>
          <HorizontalBarChart data={data.supplierRanking} xKey="label" yKeys={[{ key: 'value', color: 'var(--chart-4)' }]} height={200} formatter={(v) => fmtINR(v, true)} />
        </Card>
      </div>

      {/* ABC/XYZ/Pareto */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 shadow-soft">
          <h3 className="text-sm font-semibold mb-1">ABC Analysis</h3>
          <p className="text-xs text-muted-foreground mb-3">Revenue contribution</p>
          <DonutChart data={data.abcAnalysis} height={200} formatter={(v) => fmtINR(v, true)} centerLabel="Total" centerValue={fmtINR(data.abcAnalysis.reduce((s, d) => s + d.value, 0), true)} />
        </Card>
        <Card className="p-5 shadow-soft">
          <h3 className="text-sm font-semibold mb-1">XYZ Analysis</h3>
          <p className="text-xs text-muted-foreground mb-3">Demand variability</p>
          <DonutChart data={data.xyzAnalysis} height={200} formatter={(v) => fmtINR(v, true)} centerLabel="Total" centerValue={fmtINR(data.xyzAnalysis.reduce((s, d) => s + d.value, 0), true)} />
        </Card>
        <Card className="p-5 shadow-soft">
          <h3 className="text-sm font-semibold mb-1">Customer Segmentation</h3>
          <p className="text-xs text-muted-foreground mb-3">By LTV tiers</p>
          <DonutChart data={data.customerSegments} height={200} formatter={(v) => `${v}`} centerLabel="Total" centerValue={fmtNumber(data.customerSegments.reduce((s, d) => s + d.value, 0))} />
        </Card>
      </div>

      {/* Pareto + Forecast + Growth */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5 shadow-soft">
          <h3 className="text-sm font-semibold mb-1">Pareto Analysis — SKU Revenue</h3>
          <p className="text-xs text-muted-foreground mb-3">80/20 rule · cumulative %</p>
          <ComposedChartCard
            data={data.pareto}
            xKey="label"
            yKeys={[
              { key: 'value', label: 'Revenue', type: 'bar', color: 'var(--chart-1)' },
              { key: 'cumulative', label: 'Cumulative %', type: 'line', color: 'var(--chart-2)' },
            ]}
            height={240}
            formatter={(v) => v > 100 ? `${v.toFixed(0)}%` : fmtINR(v, true)}
          />
        </Card>
        <Card className="p-5 shadow-soft">
          <h3 className="text-sm font-semibold mb-1">Demand Forecast — Next 14 days</h3>
          <p className="text-xs text-muted-foreground mb-3">Based on 30d trend + seasonality</p>
          <AreaChartCard
            data={data.forecast}
            xKey="label"
            yKeys={[{ key: 'value', label: 'Predicted Revenue', color: 'var(--chart-3)' }]}
            height={240}
            formatter={(v) => fmtINR(v, true)}
          />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 shadow-soft">
          <h3 className="text-sm font-semibold mb-1">Growth Trend — 6 months</h3>
          <p className="text-xs text-muted-foreground mb-3">Revenue & profit</p>
          <AreaChartCard
            data={data.growthTrend}
            xKey="date"
            yKeys={[{ key: 'revenue', label: 'Revenue', color: 'var(--chart-1)' }, { key: 'profit', label: 'Profit', color: 'var(--chart-2)' }]}
            height={200}
            showLegend
            formatter={(v) => fmtINR(v, true)}
          />
        </Card>
        <Card className="p-5 shadow-soft">
          <h3 className="text-sm font-semibold mb-1">Seasonality — Day of Week</h3>
          <p className="text-xs text-muted-foreground mb-3">Sales pattern</p>
          <RadarChartCard data={data.seasonality} xKey="label" yKeys={[{ key: 'value' }]} height={200} />
        </Card>
        <Card className="p-5 shadow-soft">
          <h3 className="text-sm font-semibold mb-1">Inventory Aging</h3>
          <p className="text-xs text-muted-foreground mb-3">Batches by age</p>
          <BarChartCard data={data.inventoryAging} xKey="label" yKeys={[{ key: 'value', color: 'var(--chart-5)' }]} height={200} formatter={(v) => `${v}`} />
        </Card>
      </div>

      {/* Target achievement */}
      <Card className="p-5 shadow-soft">
        <h3 className="text-sm font-semibold mb-1">Salesman Target Achievement</h3>
        <p className="text-xs text-muted-foreground mb-3">Monthly revenue target vs achieved</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.targetAchievement.map((t, i) => (
            <div key={i} className="rounded-xl border p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">{t.label}</p>
                <Badge variant={t.value >= 100 ? 'success' : t.value >= 70 ? 'warning' : 'danger'}>
                  {t.value.toFixed(0)}%
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <RadialProgress value={Math.min(t.value, 100)} size={80} color={t.value >= 100 ? 'var(--chart-2)' : t.value >= 70 ? 'var(--chart-4)' : 'var(--chart-5)'} />
                <div className="text-xs space-y-0.5">
                  <p><span className="text-muted-foreground">Target:</span> <span className="font-medium tabular-nums">{fmtINR(t.target, true)}</span></p>
                  <p><span className="text-muted-foreground">Achieved:</span> <span className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">{fmtINR(t.achieved, true)}</span></p>
                  <p><span className="text-muted-foreground">Gap:</span> <span className="font-medium tabular-nums text-rose-600 dark:text-rose-400">{fmtINR(Math.max(0, t.target - t.achieved), true)}</span></p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
