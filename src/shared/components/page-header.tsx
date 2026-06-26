'use client'
import { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function PageHeader({
  title, description, icon: Icon, actions, breadcrumbs, accent = 'primary',
}: {
  title: string
  description?: string
  icon?: LucideIcon
  actions?: React.ReactNode
  breadcrumbs?: { label: string; onClick?: () => void }[]
  accent?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'violet'
}) {
  const accentMap = {
    primary: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    info: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', accentMap[accent])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
              {breadcrumbs.map((b, i) => (
                <span key={i} className="flex items-center gap-1">
                  {b.onClick ? (
                    <button onClick={b.onClick} className="hover:text-foreground transition-colors">{b.label}</button>
                  ) : (
                    <span>{b.label}</span>
                  )}
                  {i < breadcrumbs.length - 1 && <span className="text-muted-foreground/50">/</span>}
                </span>
              ))}
            </div>
          )}
          <h1 className="text-xl font-semibold tracking-tight truncate">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </motion.div>
  )
}
