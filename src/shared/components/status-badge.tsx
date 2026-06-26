'use client'
import { cn } from '@/lib/utils'
import { statusColor } from '@/shared/lib/format'

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const s = statusColor(status)
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', s.bg, s.text, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  )
}

export function Badge({ children, variant = 'default', className }: { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'violet' | 'outline'; className?: string }) {
  const variants = {
    default: 'bg-muted text-foreground',
    success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    danger: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
    info: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
    violet: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
    outline: 'border border-border text-foreground',
  }
  return <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium', variants[variant], className)}>{children}</span>
}
