'use client'
import { useState, useMemo, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ChevronLeft, ChevronRight, Search, ArrowUpDown, ArrowUp, ArrowDown, Inbox,
  Columns3, Download, Trash2, GripVertical, Pin, PinOff, Eye, EyeOff,
  Rows3, Rows2, TableProperties, X, CheckSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { exportCSV, exportXLSX } from '@/shared/lib/format'

export interface Column<T> {
  key: string
  header: string
  cell: (row: T) => React.ReactNode
  sortable?: boolean
  sortAccessor?: (row: T) => string | number
  width?: string
  align?: 'left' | 'right' | 'center'
  className?: string
  pinnable?: boolean
  hideable?: boolean
  groupable?: boolean
  frozen?: boolean  // default frozen
}

type Density = 'compact' | 'normal' | 'comfortable'

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
  // Selection + bulk actions
  selectable?: boolean
  getRowId?: (row: T) => string
  bulkActions?: { label: string; icon?: any; onClick: (selectedIds: string[], selectedRows: T[]) => void; variant?: 'default' | 'destructive' }[]
  // Column persistence
  storageKey?: string
}

export function DataTable<T extends { id: string }>({
  data, columns, loading, searchable = true, searchPlaceholder = 'Search...',
  pageSize = 10, emptyState, onRowClick, initialSort, toolbar, rowClassName,
  selectable = false, getRowId = (r: T) => r.id, bulkActions = [],
  storageKey,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(initialSort ?? null)
  const [density, setDensity] = useState<Density>('normal')
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set())
  const [pinnedCols, setPinnedCols] = useState<Set<string>>(new Set(columns.filter((c) => c.frozen).map((c) => c.key)))
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [colWidths, setColWidths] = useState<Record<string, number>>({})
  const [showFilters, setShowFilters] = useState(false)

  // Load persisted settings
  useEffect(() => {
    if (!storageKey) return
    try {
      const stored = localStorage.getItem(`dt-settings-${storageKey}`)
      if (stored) {
        const s = JSON.parse(stored)
        if (s.hiddenCols) setHiddenCols(new Set(s.hiddenCols))
        if (s.pinnedCols) setPinnedCols(new Set(s.pinnedCols))
        if (s.density) setDensity(s.density)
        if (s.colWidths) setColWidths(s.colWidths)
      }
    } catch {}
  }, [storageKey])

  // Persist settings
  useEffect(() => {
    if (!storageKey) return
    try {
      localStorage.setItem(`dt-settings-${storageKey}`, JSON.stringify({
        hiddenCols: [...hiddenCols],
        pinnedCols: [...pinnedCols],
        density,
        colWidths,
      }))
    } catch {}
  }, [storageKey, hiddenCols, pinnedCols, density, colWidths])

  const visibleColumns = columns.filter((c) => !hiddenCols.has(c.key))
  const pinnedColumns = visibleColumns.filter((c) => pinnedCols.has(c.key))
  const scrollableColumns = visibleColumns.filter((c) => !pinnedCols.has(c.key))

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

  const togglePin = (key: string) => {
    setPinnedCols((s) => {
      const next = new Set(s)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleHide = (key: string) => {
    setHiddenCols((s) => {
      const next = new Set(s)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const allOnPageSelected = paged.length > 0 && paged.every((r) => selectedIds.has(getRowId(r)))
  const toggleSelectAll = () => {
    setSelectedIds((s) => {
      const next = new Set(s)
      if (allOnPageSelected) {
        paged.forEach((r) => next.delete(getRowId(r)))
      } else {
        paged.forEach((r) => next.add(getRowId(r)))
      }
      return next
    })
  }

  const toggleRow = (id: string) => {
    setSelectedIds((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  // Column resize
  const startResize = (e: React.MouseEvent, key: string) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startWidth = colWidths[key] ?? 120
    const onMove = (ev: MouseEvent) => {
      setColWidths((w) => ({ ...w, [key]: Math.max(60, startWidth + ev.clientX - startX) }))
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const densityClass = {
    compact: 'py-1 text-xs',
    normal: 'py-2 text-sm',
    comfortable: 'py-3.5 text-sm',
  }[density]

  const renderCell = (col: Column<T>, row: T, isPinned: boolean) => (
    <td
      key={col.key}
      className={cn(
        'px-3 align-middle whitespace-nowrap',
        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
        col.className,
        isPinned && 'sticky bg-card z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]',
      )}
      style={{ width: colWidths[col.key] ?? col.width, minWidth: colWidths[col.key] ?? 80 }}
    >
      {col.cell(row)}
    </td>
  )

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      {(searchable || toolbar || selectable) && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
          <div className="flex items-center gap-2 flex-1">
            {searchable ? (
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setPage(0) }}
                  placeholder={searchPlaceholder}
                  className="pl-8 h-9"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ) : <div />}
          </div>
          <div className="flex items-center gap-2">
            {/* Bulk actions */}
            {selectable && selectedIds.size > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10 border border-primary/20">
                <span className="text-xs font-medium text-primary">{selectedIds.size} selected</span>
                {bulkActions.map((a, i) => (
                  <Button key={i} size="sm" variant={a.variant === 'destructive' ? 'destructive' : 'ghost'} className="h-7 text-xs"
                    onClick={() => {
                      const rows = filtered.filter((r) => selectedIds.has(getRowId(r)))
                      a.onClick([...selectedIds], rows)
                    }}
                  >
                    {a.icon && <a.icon className="h-3 w-3" />} {a.label}
                  </Button>
                ))}
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={clearSelection}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            {toolbar}
            {/* Density */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  {density === 'compact' ? <Rows3 className="h-4 w-4" /> : density === 'comfortable' ? <TableProperties className="h-4 w-4" /> : <Rows2 className="h-4 w-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Row Density</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setDensity('compact')}><Rows3 className="h-4 w-4 mr-2" /> Compact</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDensity('normal')}><Rows2 className="h-4 w-4 mr-2" /> Normal</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDensity('comfortable')}><TableProperties className="h-4 w-4 mr-2" /> Comfortable</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Column settings */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <Columns3 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Columns</DropdownMenuLabel>
                {columns.map((c) => (
                  <DropdownMenuItem key={c.key} className="flex items-center justify-between gap-2">
                    <button onClick={() => toggleHide(c.key)} className="flex items-center gap-2 flex-1">
                      {hiddenCols.has(c.key) ? <EyeOff className="h-3 w-3 text-muted-foreground" /> : <Eye className="h-3 w-3" />}
                      <span className={cn('text-xs', hiddenCols.has(c.key) && 'line-through text-muted-foreground')}>{c.header}</span>
                    </button>
                    <button onClick={() => togglePin(c.key)} className={cn('h-5 w-5 rounded flex items-center justify-center hover:bg-muted', pinnedCols.has(c.key) && 'text-primary')}>
                      {pinnedCols.has(c.key) ? <Pin className="h-3 w-3 fill-current" /> : <PinOff className="h-3 w-3 opacity-40" />}
                    </button>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { setHiddenCols(new Set()); setPinnedCols(new Set()); }}>
                  <X className="h-3 w-3 mr-2" /> Reset to defaults
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-soft">
        <div className="overflow-x-auto" style={{ maxHeight: '70vh' }}>
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-20 bg-muted/40 backdrop-blur">
              <tr className="border-b">
                {selectable && (
                  <th className="px-3 py-2.5 w-10 sticky left-0 bg-muted/40 z-30">
                    <Checkbox checked={allOnPageSelected} onCheckedChange={toggleSelectAll} />
                  </th>
                )}
                {pinnedColumns.map((c) => (
                  <th
                    key={c.key}
                    className={cn(
                      'px-3 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap sticky bg-muted/40 z-20 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]',
                      c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                    )}
                    style={{ width: colWidths[c.key] ?? c.width, left: selectable ? 40 : 0 }}
                  >
                    <div className="flex items-center gap-1" onClick={() => c.sortable && toggleSort(c.key)}>
                      {c.sortable && <GripVertical className="h-3 w-3 opacity-30 cursor-grab" />}
                      <span className={cn(c.sortable && 'cursor-pointer hover:text-foreground select-none')}>{c.header}</span>
                      {c.sortable && (
                        sort?.key === c.key ? (
                          sort.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : <ArrowUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </div>
                    {c.sortable && (
                      <div
                        className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/30"
                        onMouseDown={(e) => startResize(e, c.key)}
                      />
                    )}
                  </th>
                ))}
                {scrollableColumns.map((c) => (
                  <th
                    key={c.key}
                    className={cn(
                      'relative px-3 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap',
                      c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                    )}
                    style={{ width: colWidths[c.key] ?? c.width, minWidth: 80 }}
                  >
                    <div className="flex items-center gap-1" onClick={() => c.sortable && toggleSort(c.key)}>
                      <span className={cn(c.sortable && 'cursor-pointer hover:text-foreground select-none')}>{c.header}</span>
                      {c.sortable && (
                        sort?.key === c.key ? (
                          sort.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : <ArrowUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </div>
                    {c.sortable && (
                      <div
                        className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/30"
                        onMouseDown={(e) => startResize(e, c.key)}
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b last:border-0">
                    {selectable && <td className="px-3"><Skeleton className="h-4 w-4" /></td>}
                    {visibleColumns.map((c, j) => (
                      <td key={j} className={densityClass}><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length + (selectable ? 1 : 0)}>
                    {emptyState ?? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Inbox className="h-8 w-8 text-muted-foreground/60 mb-2" />
                        <p className="text-sm font-medium">No results found</p>
                        <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters</p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                paged.map((row, rowIdx) => {
                  const id = getRowId(row)
                  const isSelected = selectedIds.has(id)
                  return (
                    <tr
                      key={id}
                      className={cn(
                        'border-b last:border-0 hover:bg-muted/40 transition-colors',
                        onRowClick && 'cursor-pointer',
                        isSelected && 'bg-primary/5',
                        rowClassName?.(row),
                      )}
                      onClick={() => onRowClick?.(row)}
                    >
                      {selectable && (
                        <td className="px-3 sticky left-0 bg-card z-10" onClick={(e) => e.stopPropagation()}>
                          <Checkbox checked={isSelected} onCheckedChange={() => toggleRow(id)} />
                        </td>
                      )}
                      {pinnedColumns.map((c) => (
                        <td
                          key={c.key}
                          className={cn(
                            densityClass,
                            'px-3 align-middle sticky bg-card z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]',
                            c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                            c.className,
                          )}
                          style={{ width: colWidths[c.key] ?? c.width, left: selectable ? 40 : 0 }}
                        >
                          {c.cell(row)}
                        </td>
                      ))}
                      {scrollableColumns.map((c) => renderCell(c, row, false))}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {filtered.length > pageSize && (
          <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/20">
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                Showing {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, filtered.length)} of {filtered.length}
              </p>
              {selectable && selectedIds.size > 0 && (
                <span className="text-xs text-primary font-medium">· {selectedIds.size} selected</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-7" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs tabular-nums px-2">{safePage + 1} / {totalPages}</span>
              <Button variant="ghost" size="sm" className="h-7" disabled={safePage >= totalPages - 1} onClick={() => setPage(safePage + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
