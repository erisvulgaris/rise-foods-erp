'use client'
import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight, Search, ArrowUpDown, ArrowUp, ArrowDown, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Column<T> {
  key: string
  header: string
  cell: (row: T) => React.ReactNode
  sortable?: boolean
  sortAccessor?: (row: T) => string | number
  width?: string
  align?: 'left' | 'right' | 'center'
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  pageSize?: number
  emptyState?: React.ReactNode
  onRowClick?: (row: T) => void
  initialSort?: { key: string; dir: 'asc' | 'desc' }
  toolbar?: React.ReactNode
  rowClassName?: (row: T) => string
}

export function DataTable<T extends { id: string }>({
  data, columns, loading, searchable = true, searchPlaceholder = 'Search...',
  pageSize = 10, emptyState, onRowClick, initialSort, toolbar, rowClassName,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(initialSort ?? null)

  const filtered = useMemo(() => {
    let rows = data
    if (query.trim()) {
      const q = query.toLowerCase()
      rows = rows.filter((r) =>
        columns.some((c) => {
          const v = c.sortAccessor ? c.sortAccessor(r) : (r as any)[c.key]
          return String(v ?? '').toLowerCase().includes(q)
        })
      )
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key)
      if (col?.sortAccessor) {
        rows = [...rows].sort((a, b) => {
          const av = col.sortAccessor!(a), bv = col.sortAccessor!(b)
          const r = av < bv ? -1 : av > bv ? 1 : 0
          return sort.dir === 'asc' ? r : -r
        })
      }
    }
    return rows
  }, [data, query, sort, columns])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const paged = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize)

  const toggleSort = (key: string) => {
    setSort((s) => s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })
  }

  return (
    <div className="space-y-3">
      {(searchable || toolbar) && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
          {searchable ? (
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(0) }}
                placeholder={searchPlaceholder}
                className="pl-8 h-9"
              />
            </div>
          ) : <div />}
          {toolbar}
        </div>
      )}
      <div className="rounded-xl border bg-card overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={cn(
                      'px-3 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap',
                      c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                      c.sortable && 'cursor-pointer hover:text-foreground select-none'
                    )}
                    style={{ width: c.width }}
                    onClick={() => c.sortable && toggleSort(c.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {c.header}
                      {c.sortable && (
                        sort?.key === c.key ? (
                          sort.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : <ArrowUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b last:border-0">
                    {columns.map((c, j) => (
                      <td key={j} className="px-3 py-3"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={columns.length}>
                    {emptyState ?? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Inbox className="h-8 w-8 text-muted-foreground/60 mb-2" />
                        <p className="text-sm font-medium">No results found</p>
                        <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or search query</p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                paged.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      'border-b last:border-0 hover:bg-muted/40 transition-colors',
                      onRowClick && 'cursor-pointer',
                      rowClassName?.(row)
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={cn(
                          'px-3 py-2.5 align-middle',
                          c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                          c.className
                        )}
                      >
                        {c.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > pageSize && (
          <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Showing {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs tabular-nums px-2">{safePage + 1} / {totalPages}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={safePage >= totalPages - 1} onClick={() => setPage(safePage + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
