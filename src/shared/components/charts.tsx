'use client'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend,
  Line, LineChart, Pie, PieChart, PolarAngleAxis, PolarGrid, RadialBar, RadialBarChart,
  Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

interface ChartProps {
  data: any[]
  xKey: string
  yKeys: { key: string; label?: string; color?: string; type?: 'line' | 'bar' | 'area' }[]
  height?: number
  stacked?: boolean
  showLegend?: boolean
  showGrid?: boolean
  hideAxis?: boolean
  formatter?: (v: number) => string
  className?: string
}

export function LineChartCard({ data, xKey, yKeys, height = 240, showLegend, showGrid = true, formatter, className }: ChartProps) {
  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />}
          <XAxis dataKey={xKey} tickLine={false} axisLine={false} fontSize={11} />
          <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={formatter} width={48} />
          <Tooltip formatter={(v: number) => formatter ? formatter(v) : v} />
          {showLegend && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />}
          {yKeys.map((k, i) => (
            <Line
              key={k.key}
              type="monotone"
              dataKey={k.key}
              name={k.label ?? k.key}
              stroke={k.color ?? COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              animationDuration={600}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function AreaChartCard({ data, xKey, yKeys, height = 240, showLegend, showGrid = true, stacked, formatter, className }: ChartProps) {
  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            {yKeys.map((k, i) => (
              <linearGradient key={k.key} id={`grad-${k.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={k.color ?? COLORS[i % COLORS.length]} stopOpacity={0.35} />
                <stop offset="100%" stopColor={k.color ?? COLORS[i % COLORS.length]} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />}
          <XAxis dataKey={xKey} tickLine={false} axisLine={false} fontSize={11} />
          <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={formatter} width={48} />
          <Tooltip formatter={(v: number) => formatter ? formatter(v) : v} />
          {showLegend && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />}
          {yKeys.map((k, i) => (
            <Area
              key={k.key}
              type="monotone"
              dataKey={k.key}
              name={k.label ?? k.key}
              stroke={k.color ?? COLORS[i % COLORS.length]}
              strokeWidth={2}
              fill={`url(#grad-${k.key})`}
              stackId={stacked ? '1' : undefined}
              animationDuration={600}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function BarChartCard({ data, xKey, yKeys, height = 240, showLegend, showGrid = true, stacked, formatter, className }: ChartProps) {
  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />}
          <XAxis dataKey={xKey} tickLine={false} axisLine={false} fontSize={11} />
          <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={formatter} width={48} />
          <Tooltip formatter={(v: number) => formatter ? formatter(v) : v} cursor={{ fill: 'var(--muted)', opacity: 0.4 }} />
          {showLegend && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />}
          {yKeys.map((k, i) => (
            <Bar
              key={k.key}
              dataKey={k.key}
              name={k.label ?? k.key}
              fill={k.color ?? COLORS[i % COLORS.length]}
              stackId={stacked ? '1' : undefined}
              radius={stacked ? 0 : [4, 4, 0, 0]}
              animationDuration={600}
              maxBarSize={48}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function HorizontalBarChart({ data, xKey, yKeys, height = 240, formatter, className }: ChartProps) {
  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart layout="vertical" data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} tickFormatter={formatter} />
          <YAxis type="category" dataKey={xKey} tickLine={false} axisLine={false} fontSize={11} width={100} />
          <Tooltip formatter={(v: number) => formatter ? formatter(v) : v} cursor={{ fill: 'var(--muted)', opacity: 0.4 }} />
          {yKeys.map((k, i) => (
            <Bar key={k.key} dataKey={k.key} name={k.label ?? k.key} fill={k.color ?? COLORS[i % COLORS.length]} radius={[0, 4, 4, 0]} animationDuration={600} maxBarSize={20} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function DonutChart({ data, height = 240, formatter, className, centerLabel, centerValue }: { data: { label: string; value: number }[]; height?: number; formatter?: (v: number) => string; className?: string; centerLabel?: string; centerValue?: string }) {
  return (
    <div className={cn('relative w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={56} outerRadius={84} paddingAngle={2} strokeWidth={0} animationDuration={600}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v: number) => formatter ? formatter(v) : v} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      {centerValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ top: '-12%' }}>
          <p className="text-xs text-muted-foreground">{centerLabel}</p>
          <p className="text-xl font-semibold tabular-nums">{centerValue}</p>
        </div>
      )}
    </div>
  )
}

export function RadialProgress({ value, label, color = 'var(--chart-2)', size = 120 }: { value: number; label?: string; color?: string; size?: number }) {
  const data = [{ name: 'progress', value }]
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart cx="50%" cy="50%" innerRadius="68%" outerRadius="100%" data={data} startAngle={90} endAngle={90 - 360}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar background={{ fill: 'var(--muted)' }} dataKey="value" cornerRadius={10} fill={color} animationDuration={600} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold tabular-nums">{value.toFixed(0)}%</span>
        {label && <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>}
      </div>
    </div>
  )
}

export function RadarChartCard({ data, xKey, yKeys, height = 240, className }: ChartProps) {
  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey={xKey} tickLine={false} axisLine={false} fontSize={11} />
          <Radar dataKey={yKeys[0].key} stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.35} strokeWidth={2} animationDuration={600} />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ComposedChartCard({ data, xKey, yKeys, height = 240, formatter, className }: ChartProps) {
  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey={xKey} tickLine={false} axisLine={false} fontSize={11} />
          <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={formatter} width={48} />
          <Tooltip formatter={(v: number) => formatter ? formatter(v) : v} />
          {yKeys.map((k, i) => {
            if (k.type === 'bar') {
              return <Bar key={k.key} dataKey={k.key} name={k.label ?? k.key} fill={k.color ?? COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} maxBarSize={36} animationDuration={600} />
            }
            if (k.type === 'area') {
              return <Area key={k.key} type="monotone" dataKey={k.key} name={k.label ?? k.key} stroke={k.color ?? COLORS[i % COLORS.length]} fill={k.color ?? COLORS[i % COLORS.length]} fillOpacity={0.15} strokeWidth={2} animationDuration={600} />
            }
            return <Line key={k.key} type="monotone" dataKey={k.key} name={k.label ?? k.key} stroke={k.color ?? COLORS[i % COLORS.length]} strokeWidth={2} dot={false} animationDuration={600} />
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export function HeatmapGrid({ data, formatter, className }: { data: { label: string; value: number }[]; formatter?: (v: number) => string; className?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className={cn('grid gap-2', className)} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
      {data.map((d, i) => {
        const intensity = d.value / max
        const opacity = 0.15 + intensity * 0.85
        return (
          <motion.div
            key={d.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.02 }}
            className="rounded-lg p-3 border relative overflow-hidden"
            style={{
              background: `color-mix(in oklch, var(--primary) ${opacity * 100}%, var(--card))`,
              borderColor: `color-mix(in oklch, var(--primary) 15%, var(--border))`,
            }}
          >
            <p className="text-xs font-medium truncate">{d.label}</p>
            <p className="text-lg font-semibold tabular-nums mt-1">{formatter ? formatter(d.value) : d.value}</p>
          </motion.div>
        )
      })}
    </div>
  )
}
