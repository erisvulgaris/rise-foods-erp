'use client'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function LoadingRow({ columns = 5 }: { columns?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className={cn('h-4', j === 0 ? 'w-32' : j === 1 ? 'w-48' : 'w-20')} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function EmptyState({
  title, description, icon: Icon, action,
}: {
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-base font-medium">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-soft">
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-7 w-32 mb-3" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border bg-card p-5 shadow-soft', className)}>
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton className="h-[240px] w-full" />
    </div>
  )
}
