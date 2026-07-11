'use client'
import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/shared/components/status-badge'
import { ChevronDown, ChevronRight, Layers, Sum } from 'lucide-react'
import type { Column } from '@/shared/components/data-table'

interface EnhancedTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  groupBy?: string
  onGroupByChange?: (field: string | null) => void
  showSummary?: boolean
  summaryFields?: { field: string; label: string; type: 'sum' | 'avg' | 'count' | 'min' | 'max' }[]
  pageSize?: number
  onRowClick?: (row: T) => void
  emptyState?: React.ReactNode
  storageKey?: string
}

export function EnhancedTable<T extends { id: string }>({
  data, columns, loading, groupBy, onGroupByChange, showSummary, summaryFields, pageSize = 12, onRowClick, emptyState, storageKey,
}: EnhancedTableProps<T>) {
  const [page, setPage] = useState(0)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  // Group data
  const groupedData = useMemo(() => {
    if (!groupBy) return null
    const groups = new Map<string, T[]>()
    for (const row of data) {
      const key = String((row as any)[groupBy] ?? '—')
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(row)
    }
    return Array.from(groups.entries()).map(([key, rows]) => ({ key, rows }))
  }, [data, groupBy])

  // Summary calculations
  const summary = useMemo(() => {
    if (!showSummary || !summaryFields) return null
    return summaryFields.map((sf) => {
      const values = data.map((r) => Number((r as any)[sf.field] ?? 0)).filter((v) => !isNaN(v))
      let result = 0
      switch (sf.type) {
        case 'sum': result = values.reduce((s, v) => s + v, 0); break
        case 'avg': result = values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0; break
        case 'count': result = data.length; break
        case 'min': result = values.length ? Math.min(...values) : 0; break
        case 'max': result = values.length ? Math.max(...values) : 0; break
      }
      return { ...sf, value: result }
    })
  }, [data, showSummary, summaryFields])

  const toggleGroup = (key: string) => {
    setCollapsedGroups((s) => {
      const next = new Set(s)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const paged = groupedData ? data : data.slice(safePage * pageSize, safePage * pageSize + pageSize)

  if (loading) {
    return (
      <div className="rounded-xl border bg-card overflow-hidden shadow-soft">
        <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Group by selector */}
      {onGroupByChange && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1"><Layers className="h-3 w-3" /> Group by:</span>
          <select
            value={groupBy ?? ''}
            onChange={(e) => onGroupByChange(e.target.value || null)}
            className="h-7 text-xs border rounded-md px-2 bg-card"
          >
            <option value="">No grouping</option>
            {columns.filter((c) => c.sortable).map((c) => (
              <option key={c.key} value={c.key}>{c.header}</option>
            ))}
          </select>
        </div>
      )}

      {/* Grouped view */}
      {groupedData ? (
        <div className="space-y-3">
          {groupedData.map(({ key, rows }) => {
            const isCollapsed = collapsedGroups.has(key)
            return (
              <div key={key} className="rounded-lg border overflow-hidden">
                <button
                  onClick={() => toggleGroup(key)}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-muted/40 hover:bg-muted/60 transition-colors text-left"
                >
                  {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  <span className="text-sm font-medium">{key}</span>
                  <Badge variant="outline" className="text-[10px]">{rows.length}</Badge>
                  {summaryFields && summaryFields.map((sf) => {
                    const groupSum = rows.reduce((s, r) => s + Number((r as any)[sf.field] ?? 0), 0)
                    return <span key={sf.field} className="text-xs text-muted-foreground ml-2">{sf.label}: <strong className="tabular-nums">{groupSum.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong></span>
                  })}
                </button>
                {!isCollapsed && (
                  <table className="w-full text-sm">
                    <thead className="bg-muted/20">
                      <tr>
                        {columns.map((c) => (
                          <th key={c.key} className={cn('px-3 py-2 text-xs font-medium uppercase text-muted-foreground', c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left')}>{c.header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.id} className="border-t hover:bg-muted/30 cursor-pointer" onClick={() => onRowClick?.(row)}>
                          {columns.map((c) => (
                            <td key={c.key} className={cn('px-3 py-2', c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left', c.className)}>{c.cell(row)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* Regular table */
        <div className="rounded-xl border bg-card overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 sticky top-0">
                <tr className="border-b">
                  {columns.map((c) => (
                    <th key={c.key} className={cn('px-3 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap', c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left')} style={{ width: c.width }}>{c.header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr><td colSpan={columns.length}>{emptyState ?? <div className="py-12 text-center text-sm text-muted-foreground">No results found</div>}</td></tr>
                ) : paged.map((row) => (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors cursor-pointer" onClick={() => onRowClick?.(row)}>
                    {columns.map((c) => (
                      <td key={c.key} className={cn('px-3 py-2.5 align-middle', c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left', c.className)}>{c.cell(row)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
              {/* Summary row */}
              {summary && (
                <tfoot className="bg-muted/30 border-t-2">
                  <tr>
                    {columns.map((c) => {
                      const sf = summary.find((s) => s.field === c.key)
                      return (
                        <td key={c.key} className={cn('px-3 py-2.5 font-semibold text-sm', c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left')}>
                          {sf ? (
                            <span className="flex items-center gap-1 tabular-nums">
                              <Sum className="h-3 w-3 text-muted-foreground" />
                              {sf.type === 'count' ? sf.value : sf.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </span>
                          ) : c.key === columns[0].key ? (
                            <span className="text-xs text-muted-foreground uppercase">Total ({data.length} rows)</span>
                          ) : null}
                        </td>
                      )
                    })}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          {data.length > pageSize && (
            <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/20">
              <p className="text-xs text-muted-foreground">Showing {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, data.length)} of {data.length}</p>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-7" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>←</Button>
                <span className="text-xs tabular-nums px-2">{safePage + 1} / {totalPages}</span>
                <Button variant="ghost" size="sm" className="h-7" disabled={safePage >= totalPages - 1} onClick={() => setPage(safePage + 1)}>→</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
