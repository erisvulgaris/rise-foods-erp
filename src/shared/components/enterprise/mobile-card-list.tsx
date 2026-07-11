'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { Column } from '@/shared/components/data-table'

interface MobileCardListProps<T> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (row: T) => void
  primaryField?: string
  secondaryField?: string
}

/**
 * Responsive table that shows as cards on mobile and table on desktop.
 * Use alongside DataTable — this component is for mobile-only rendering.
 */
export function MobileCardList<T extends { id: string }>({ data, columns, onRowClick, primaryField, secondaryField }: MobileCardListProps<T>) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const primaryCol = primaryField ? columns.find((c) => c.key === primaryField) : columns[0]
  const secondaryCol = secondaryField ? columns.find((c) => c.key === secondaryField) : columns[1]
  const detailCols = columns.filter((c) => c !== primaryCol && c !== secondaryCol)

  return (
    <div className="sm:hidden space-y-2">
      {data.map((row) => {
        const isExpanded = expandedId === row.id
        return (
          <div
            key={row.id}
            className="rounded-lg border bg-card p-3 shadow-soft"
            onClick={() => onRowClick?.(row)}
          >
            <div className="flex items-start justify-between gap-2" onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : row.id) }}>
              <div className="min-w-0 flex-1">
                {primaryCol && <div className="text-sm font-medium">{primaryCol.cell(row)}</div>}
                {secondaryCol && <div className="text-xs text-muted-foreground mt-0.5">{secondaryCol.cell(row)}</div>}
              </div>
              {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
            </div>
            {isExpanded && (
              <div className="mt-3 pt-3 border-t space-y-2">
                {detailCols.map((c) => (
                  <div key={c.key} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{c.header}</span>
                    <span className="text-xs font-medium text-right">{c.cell(row)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
      {data.length === 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">No results found</div>
      )}
    </div>
  )
}

/**
 * Responsive wrapper: shows DataTable on desktop, MobileCardList on mobile.
 */
export function ResponsiveTable<T extends { id: string }>({
  data, columns, onRowClick, primaryField, secondaryField, ...tableProps
}: MobileCardListProps<T> & { [key: string]: any }) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden sm:block">
        {/* DataTable from data-table.tsx will be used directly in modules */}
        <DesktopTableWrapper data={data} columns={columns} onRowClick={onRowClick} {...tableProps} />
      </div>
      {/* Mobile cards */}
      <MobileCardList data={data} columns={columns} onRowClick={onRowClick} primaryField={primaryField} secondaryField={secondaryField} />
    </>
  )
}

// Simple desktop table wrapper (modules can use DataTable directly)
function DesktopTableWrapper<T extends { id: string }>({ data, columns, onRowClick, ...props }: any) {
  // Re-export the actual DataTable would create circular import — inline a simple version
  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="border-b">
              {columns.map((c: Column<T>) => (
                <th key={c.key} className={cn('px-3 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap', c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left')} style={{ width: c.width }}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, props.pageSize ?? 12).map((row: T) => (
              <tr key={row.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors cursor-pointer" onClick={() => onRowClick?.(row)}>
                {columns.map((c: Column<T>) => (
                  <td key={c.key} className={cn('px-3 py-2.5 align-middle', c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left', c.className)}>{c.cell(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
