'use client'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ArrowDownRight, ArrowUpRight, LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'

interface KPICardProps {
  label: string
  value: string
  delta?: number
  deltaLabel?: string
  icon?: LucideIcon
  accent?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'violet'
  sublabel?: string
  sparkline?: number[]
  loading?: boolean
}

const accentMap = {
  primary: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', stroke: 'rgb(249 115 22)' },
  success: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', stroke: 'rgb(16 185 129)' },
  warning: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', stroke: 'rgb(245 158 11)' },
  danger: { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', stroke: 'rgb(244 63 94)' },
  info: { bg: 'bg-sky-500/10', text: 'text-sky-600 dark:text-sky-400', stroke: 'rgb(14 165 233)' },
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', stroke: 'rgb(139 92 246)' },
}

export function KPICard({ label, value, delta, deltaLabel, icon: Icon, accent = 'primary', sublabel, sparkline, loading }: KPICardProps) {
  const a = accentMap[accent]
  if (loading) {
    return (
      <Card className="kpi-card relative overflow-hidden p-5 shadow-soft">
        <div className="space-y-3">
          <div className="h-4 w-24 rounded shimmer" />
          <div className="h-7 w-32 rounded shimmer" />
          <div className="h-3 w-20 rounded shimmer" />
        </div>
      </Card>
    )
  }
  const isPositive = (delta ?? 0) >= 0
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="kpi-card group relative overflow-hidden p-5 shadow-soft hover:shadow-soft-md hover:border-primary/30">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5 min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground truncate">{label}</p>
            <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
            {sublabel && <p className="text-xs text-muted-foreground truncate">{sublabel}</p>}
          </div>
          {Icon && (
            <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl shrink-0', a.bg)}>
              <Icon className={cn('h-4 w-4', a.text)} />
            </div>
          )}
        </div>
        {(delta !== undefined || sparkline) && (
          <div className="mt-3 flex items-center justify-between gap-2">
            {delta !== undefined && (
              <div className={cn('inline-flex items-center gap-1 text-xs font-medium', isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                <span className="tabular-nums">{Math.abs(delta).toFixed(1)}%</span>
                {deltaLabel && <span className="text-muted-foreground font-normal">{deltaLabel}</span>}
              </div>
            )}
            {sparkline && sparkline.length > 1 && (
              <Sparkline data={sparkline} color={a.stroke} />
            )}
          </div>
        )}
      </Card>
    </motion.div>
  )
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 80, h = 24
  const max = Math.max(...data), min = Math.min(...data)
  const range = max - min || 1
  const pts = data.map((d, i) => `${(i / (data.length - 1)) * w},${h - ((d - min) / range) * h}`).join(' ')
  return (
    <svg width={w} height={h} className="opacity-80">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
